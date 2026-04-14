import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import {
  chatWithDocumentation,
  createProjectAndGenerateDocs,
  getProjectChatHistory,
  getProjectDetails,
  getProjectDocumentation,
  regenerateDocumentation
} from "../controllers/projectController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: env.MAX_UPLOAD_FILES,
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024
  }
});

export const projectRouter = Router();

projectRouter.post("/", upload.array("files", env.MAX_UPLOAD_FILES), createProjectAndGenerateDocs);
projectRouter.get("/:projectId", getProjectDetails);
projectRouter.get("/:projectId/docs", getProjectDocumentation);
projectRouter.get("/:projectId/chat-history", getProjectChatHistory);
projectRouter.post("/:projectId/generate", regenerateDocumentation);
projectRouter.post("/:projectId/chat", chatWithDocumentation);
