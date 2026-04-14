import crypto from "crypto";
import path from "path";
import { getCachedProjects, loadProjects, replaceCachedProjects } from "../storage/projectStore.js";

await loadProjects();

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .match(/[a-z0-9_]+/g)
    ?.filter((word) => word.length > 2) ?? [];
}

function parseMarkdownSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = {
    title: "Overview",
    level: 1,
    content: []
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);

    if (headingMatch) {
      if (current.content.length > 0 || current.title !== "Overview") {
        sections.push({
          id: slugify(current.title),
          title: current.title,
          level: current.level,
          content: current.content.join("\n").trim()
        });
      }

      current = {
        title: headingMatch[2].trim(),
        level: headingMatch[1].length,
        content: []
      };
      continue;
    }

    current.content.push(line);
  }

  sections.push({
    id: slugify(current.title),
    title: current.title,
    level: current.level,
    content: current.content.join("\n").trim()
  });

  return sections.filter((section) => section.title || section.content);
}

function scoreSection(section, tokens) {
  const titleTokens = tokenize(section.title);
  const contentTokens = tokenize(section.content);
  let score = 0;

  for (const token of tokens) {
    if (titleTokens.includes(token)) {
      score += 4;
    }

    if (contentTokens.includes(token)) {
      score += 1;
    }
  }

  if (/api|endpoint|request|response/.test(section.title.toLowerCase())) {
    score += 2;
  }

  return score;
}

function buildProjectName(sourceLabel, fallback = "Smart Documentation Project") {
  if (fallback && fallback.trim()) {
    return fallback.trim();
  }

  if (sourceLabel) {
    try {
      const url = new URL(sourceLabel);
      const pathname = url.pathname.split("/").filter(Boolean);

      if (pathname.length >= 2) {
        return pathname[1].replace(/\.[^.]+$/, "") || "Smart Documentation Project";
      }

      if (pathname.length === 1) {
        return pathname[0].replace(/\.[^.]+$/, "") || "Smart Documentation Project";
      }
    } catch {
      return path.basename(sourceLabel).replace(/\.[^.]+$/, "") || "Smart Documentation Project";
    }

    return path.basename(sourceLabel).replace(/\.[^.]+$/, "") || "Smart Documentation Project";
  }

  return "Smart Documentation Project";
}

function normalizeProject(project) {
  return {
    ...project,
    files: project.files || [],
    sections: project.sections || [],
    chatHistory: project.chatHistory || []
  };
}

function persistProjects(projects) {
  return replaceCachedProjects(projects.map(normalizeProject));
}

export function listProjects() {
  return getCachedProjects().map((project) => serializeProject(normalizeProject(project)));
}

export function createProject({
  sourceType,
  sourceLabel,
  files,
  repositoryUrl,
  projectName
}) {
  const id = crypto.randomUUID();
  const name = buildProjectName(sourceLabel, projectName);

  const project = normalizeProject({
    id,
    name,
    sourceType,
    sourceLabel,
    repositoryUrl: repositoryUrl || "",
    files,
    documentation: "",
    sections: [],
    chatHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  persistProjects([...getCachedProjects(), project]);
  return project;
}

export function getProject(projectId) {
  return normalizeProject(getCachedProjects().find((project) => project.id === projectId) || null);
}

export function updateProjectDocumentation(projectId, documentation) {
  const nextProjects = getCachedProjects().map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    return normalizeProject({
      ...project,
      documentation,
      sections: parseMarkdownSections(documentation),
      updatedAt: new Date().toISOString()
    });
  });

  const project = nextProjects.find((item) => item.id === projectId) || null;

  if (!project) {
    return null;
  }

  persistProjects(nextProjects);
  return project;
}

export function appendChatHistory(projectId, entry) {
  const nextProjects = getCachedProjects().map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    return normalizeProject({
      ...project,
      chatHistory: [...(project.chatHistory || []), entry],
      updatedAt: new Date().toISOString()
    });
  });

  const project = nextProjects.find((item) => item.id === projectId) || null;

  if (!project) {
    return null;
  }

  persistProjects(nextProjects);
  return project;
}

export function getProjectHistory(projectId) {
  const project = getProject(projectId);

  if (!project) {
    return [];
  }

  return project.chatHistory || [];
}

export function getRelevantSections(projectId, question, limit = 4) {
  const project = getProject(projectId);

  if (!project || !project.sections.length) {
    return [];
  }

  const tokens = tokenize(question);

  return [...project.sections]
    .map((section) => ({
      ...section,
      score: scoreSection(section, tokens)
    }))
    .filter((section) => section.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function serializeProject(project) {
  return {
    id: project.id,
    name: project.name,
    sourceType: project.sourceType,
    sourceLabel: project.sourceLabel,
    repositoryUrl: project.repositoryUrl,
    fileCount: project.files.length,
    documentation: project.documentation,
    sections: project.sections,
    chatHistory: project.chatHistory,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}
