import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const GROK_API_URL = env.GROK_API_URL;

function getModelCandidates() {
  const fallbacks = (env.GROK_MODEL_FALLBACKS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [env.GROK_MODEL, ...fallbacks].filter(Boolean);
}

function isModelNotFound(status, errorText) {
  return status === 400 && /model\s+not\s+found/i.test(errorText || "");
}

function isProviderAccessError(status, errorText) {
  const message = String(errorText || "").toLowerCase();

  if (status === 401 || status === 403) {
    return true;
  }

  return (
    message.includes("no credits") ||
    message.includes("licenses") ||
    message.includes("incorrect api key") ||
    message.includes("permission")
  );
}

function buildInputFromMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content
  }));
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputItems = Array.isArray(data?.output) ? data.output : [];
  const textParts = [];

  for (const item of outputItems) {
    const contentItems = Array.isArray(item?.content) ? item.content : [];

    for (const contentItem of contentItems) {
      if (typeof contentItem?.text === "string" && contentItem.text.trim()) {
        textParts.push(contentItem.text.trim());
      }
    }
  }

  if (textParts.length) {
    return textParts.join("\n\n");
  }

  return "";
}

function truncateContent(text, maxLength = 3000) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}\n\n[Truncated for prompt size]`;
}

function isLikelyXaiKey(apiKey) {
  return typeof apiKey === "string" && /^xai-[A-Za-z0-9]/.test(apiKey.trim());
}

function formatSourceFiles(files) {
  return files
    .map((file) => {
      const preview = truncateContent(file.content, 3500);

      return [
        `File: ${file.path}`,
        `Language: ${file.language}`,
        "Content:",
        preview
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function inferProjectStructure(files) {
  const folders = new Set();

  for (const file of files) {
    const parts = String(file.path || "").split("/");

    if (parts.length > 1) {
      folders.add(parts.slice(0, -1).join("/"));
    }
  }

  return [...folders].slice(0, 12);
}

function detectLikelyApiFiles(files) {
  return files
    .filter((file) => /route|controller|api|server|handler/i.test(file.path || ""))
    .slice(0, 8);
}

function buildLocalDocumentation({ projectName, sourceType, sourceLabel, files }) {
  const safeFiles = Array.isArray(files) ? files : [];
  const folders = inferProjectStructure(safeFiles);
  const apiFiles = detectLikelyApiFiles(safeFiles);
  const listedFiles = safeFiles.slice(0, 20);

  return [
    `# Overview`,
    ``,
    `**${projectName}** documentation was generated in local fallback mode because the xAI account currently cannot serve requests.`,
    ``,
    `- Source type: ${sourceType}`,
    `- Source label: ${sourceLabel}`,
    `- Total files analyzed: ${safeFiles.length}`,
    ``,
    `# Project Structure`,
    ``,
    ...(folders.length
      ? folders.map((folder) => `- ${folder}`)
      : ["- No nested folders detected from provided source input."]),
    ``,
    `# Core Functions and Classes`,
    ``,
    `The following files are good starting points for core logic review:`,
    ``,
    ...listedFiles.map((file) => `- ${file.path} (${file.language || "text"})`),
    ``,
    `# API / Entry Points`,
    ``,
    ...(apiFiles.length
      ? apiFiles.map((file) => `- Inspect ${file.path} for routes/controllers and request handling.`)
      : ["- No API-specific filenames were detected automatically. Review backend entrypoints manually."]),
    ``,
    `# Example Usage`,
    ``,
    "```bash",
    "# Generate docs",
    "curl -X POST http://localhost:4000/api/projects -F \"projectName=My Project\" -F \"files=@./src/index.js\"",
    "",
    "# Ask question",
    "curl -X POST http://localhost:4000/api/projects/<projectId>/chat -H \"Content-Type: application/json\" -d '{\"question\":\"What are the main modules?\"}'",
    "```",
    ``,
    `# Implementation Notes`,
    ``,
    `- Local fallback mode is active when xAI credentials/account cannot run model inference.`,
    `- Add xAI team credits/licenses and valid API keys to restore AI-generated deep documentation.`
  ].join("\n");
}

function buildLocalAnswer({ question, contextSections }) {
  const sections = Array.isArray(contextSections) ? contextSections : [];

  if (!sections.length) {
    return [
      `Local fallback mode answer:`,
      ``,
      `I could not find a strongly relevant section for: **${question}**.`,
      `Try generating docs again after xAI account credits/licenses are enabled.`
    ].join("\n");
  }

  const topSections = sections.slice(0, 3);

  return [
    `Local fallback mode answer for: **${question}**`,
    ``,
    `Most relevant documentation sections:`,
    ...topSections.map((section) => `- **${section.title}**`),
    ``,
    `xAI inference is currently unavailable due account/permission issues, so this is a context-only response.`
  ].join("\n");
}

async function callGrok(messages, temperature = 0.2) {
  const rawApiKeys = [env.GROK_API_KEY, env.GROK_API_KEY_FALLBACK].filter(Boolean);
  const apiKeys = [...new Set(rawApiKeys.filter(isLikelyXaiKey))];
  const models = getModelCandidates();

  if (!apiKeys.length) {
    if (rawApiKeys.length) {
      throw new HttpError(500, "Configured Grok key format is invalid. Keys must start with 'xai-'.");
    }

    throw new HttpError(500, "GROK_API_KEY or GROK_API_KEY_FALLBACK must be configured.");
  }

  if (!models.length) {
    throw new HttpError(500, "GROK_MODEL must be configured.");
  }

  let lastStatus = 500;
  let lastErrorText = "Unknown error";

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
      const response = await fetch(GROK_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeys[keyIndex]}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: models[modelIndex],
          temperature,
          input: buildInputFromMessages(messages)
        })
      });

      if (response.ok) {
        const data = await response.json();
        const output = extractOutputText(data);

        if (!output) {
          throw new HttpError(502, "Grok returned an empty response.");
        }

        return output.trim();
      }

      lastStatus = response.status;
      lastErrorText = await response.text();

      const authError = response.status === 401 || response.status === 403;
      const modelMissing = isModelNotFound(response.status, lastErrorText);
      const hasMoreKeys = keyIndex < apiKeys.length - 1;
      const hasMoreModels = modelIndex < models.length - 1;

      if (authError && hasMoreKeys) {
        continue;
      }

      if (modelMissing && hasMoreModels) {
        break;
      }

      if (!(authError || modelMissing)) {
        throw new HttpError(lastStatus, `Grok request failed: ${lastErrorText}`);
      }
    }
  }

  throw new HttpError(lastStatus, `Grok request failed: ${lastErrorText}`);
}

export async function generateDocumentation({ projectName, sourceType, sourceLabel, files }) {
  const systemPrompt = [
    "You are a senior developer documentation writer.",
    "Produce clean GitBook/Docusaurus-style Markdown for a software project.",
    "Be precise, practical, and structured.",
    "Return only Markdown, no preamble or explanation outside the document."
  ].join(" ");

  const userPrompt = [
    `Project name: ${projectName}`,
    `Source type: ${sourceType}`,
    `Source label: ${sourceLabel}`,
    "",
    "Write documentation with these sections:",
    "# Overview",
    "# Project Structure",
    "# Core Functions and Classes",
    "# API / Entry Points",
    "# Example Usage",
    "# Implementation Notes",
    "",
    "Requirements:",
    "- Explain what the project does in one concise overview.",
    "- Explain the important modules, functions, classes, and responsibilities.",
    "- If the source exposes APIs or routes, document them with method, path, input, and output.",
    "- Include short code examples when useful.",
    "- Use Markdown headings and lists for readability.",
    "- Keep wording technical and actionable.",
    "",
    "Source files:",
    formatSourceFiles(files)
  ].join("\n");

  try {
    return await callGrok(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      0.15
    );
  } catch (error) {
    if (error instanceof HttpError && isProviderAccessError(error.statusCode, error.message)) {
      return buildLocalDocumentation({ projectName, sourceType, sourceLabel, files });
    }

    throw error;
  }
}

export async function answerFromDocumentation({ question, documentation, contextSections }) {
  const contextText = contextSections.length
    ? contextSections
        .map((section) => [`## ${section.title}`, section.content].join("\n"))
        .join("\n\n")
    : documentation;

  const systemPrompt = [
    "You are a documentation chatbot for a software project.",
    "Answer only using the provided documentation context.",
    "If the answer cannot be found, say that it is not present in the docs.",
    "Keep the reply concise, useful, and grounded in the source documentation.",
    "Return Markdown when formatting helps readability."
  ].join(" ");

  const userPrompt = [
    "Documentation context:",
    contextText,
    "",
    `Question: ${question}`,
    "",
    "Answer with a direct response and cite the relevant section names when helpful."
  ].join("\n");

  try {
    return await callGrok(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      0.1
    );
  } catch (error) {
    if (error instanceof HttpError && isProviderAccessError(error.statusCode, error.message)) {
      return buildLocalAnswer({ question, contextSections });
    }

    throw error;
  }
}
