import crypto from "crypto";
import { HttpError } from "../utils/httpError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  appendChatHistory,
  createProject,
  getProject,
  getProjectHistory,
  getRelevantSections,
  serializeProject,
  updateProjectDocumentation
} from "../services/documentService.js";
import {
  extractFilesFromRepository,
  extractUploadedFiles,
  summarizeSourceFiles
} from "../services/sourceService.js";
import { generateDocumentation, answerFromDocumentation } from "../services/grokService.js";

function requireProject(projectId) {
  const project = getProject(projectId);

  if (!project) {
    throw new HttpError(404, "Project not found.");
  }

  return project;
}

export const createProjectAndGenerateDocs = asyncHandler(async (req, res) => {
  const { projectName = "", repoUrl = "" } = req.body;
  const uploadedFiles = extractUploadedFiles(req.files || []);

  if (!repoUrl && uploadedFiles.length === 0) {
    throw new HttpError(400, "Upload at least one text file or provide a GitHub repository URL.");
  }

  const sourceFiles = repoUrl
    ? await extractFilesFromRepository(repoUrl)
    : uploadedFiles;

  const project = createProject({
    sourceType: repoUrl ? "github" : "upload",
    sourceLabel: repoUrl || uploadedFiles[0]?.name || "Uploaded files",
    files: sourceFiles,
    repositoryUrl: repoUrl,
    projectName
  });

  const documentation = await generateDocumentation({
    projectName: project.name,
    sourceType: project.sourceType,
    sourceLabel: project.sourceLabel,
    files: sourceFiles
  });

  updateProjectDocumentation(project.id, documentation);

  res.status(201).json({
    project: serializeProject(requireProject(project.id)),
    sourceFiles: summarizeSourceFiles(sourceFiles)
  });
});

export const regenerateDocumentation = asyncHandler(async (req, res) => {
  const project = requireProject(req.params.projectId);

  const documentation = await generateDocumentation({
    projectName: project.name,
    sourceType: project.sourceType,
    sourceLabel: project.sourceLabel,
    files: project.files
  });

  updateProjectDocumentation(project.id, documentation);

  res.json({
    project: serializeProject(requireProject(project.id))
  });
});

export const getProjectDetails = asyncHandler(async (req, res) => {
  const project = requireProject(req.params.projectId);

  res.json({
    project: serializeProject(project)
  });
});

export const getProjectDocumentation = asyncHandler(async (req, res) => {
  const project = requireProject(req.params.projectId);

  res.json({
    projectId: project.id,
    documentation: project.documentation,
    sections: project.sections
  });
});

export const getProjectChatHistory = asyncHandler(async (req, res) => {
  const project = requireProject(req.params.projectId);

  res.json({
    projectId: project.id,
    chatHistory: getProjectHistory(project.id)
  });
});

export const chatWithDocumentation = asyncHandler(async (req, res) => {
  const project = requireProject(req.params.projectId);
  const { question } = req.body;

  if (!question || !question.trim()) {
    throw new HttpError(400, "Question is required.");
  }

  if (!project.documentation) {
    throw new HttpError(400, "Generate documentation before starting a chat.");
  }

  const relevantSections = getRelevantSections(project.id, question);
  const answer = await answerFromDocumentation({
    question,
    documentation: project.documentation,
    contextSections: relevantSections
  });

  appendChatHistory(project.id, {
    id: crypto.randomUUID(),
    role: "exchange",
    question: question.trim(),
    answer,
    sources: relevantSections.map((section) => ({
      id: section.id,
      title: section.title,
      score: section.score
    })),
    createdAt: new Date().toISOString()
  });

  res.json({
    answer,
    sources: relevantSections.map((section) => ({
      id: section.id,
      title: section.title,
      score: section.score
    }))
  });
});
