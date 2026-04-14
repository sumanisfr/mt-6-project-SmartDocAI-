const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

export async function createDocumentation({ projectName, repoUrl, files }) {
  const formData = new FormData();

  if (projectName) {
    formData.append("projectName", projectName);
  }

  if (repoUrl) {
    formData.append("repoUrl", repoUrl);
  }

  for (const file of files || []) {
    formData.append("files", file);
  }

  return request("/api/projects", {
    method: "POST",
    body: formData
  });
}

export async function askQuestion(projectId, question) {
  return request(`/api/projects/${projectId}/chat`, {
    method: "POST",
    body: JSON.stringify({ question })
  });
}

export async function getProject(projectId) {
  return request(`/api/projects/${projectId}`);
}

export async function getProjectChatHistory(projectId) {
  return request(`/api/projects/${projectId}/chat-history`);
}
