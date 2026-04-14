import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { projectRouter } from "./routes/projectRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { listProjects } from "./services/documentService.js";

export const app = express();

const configuredOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  if (/^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
    return true;
  }

  if (/\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Smart Documentation Platform API</title>
        <style>
          :root { color-scheme: dark; font-family: Inter, Segoe UI, system-ui, sans-serif; }
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07111f; color: #e5eef9; }
          .card { width: min(720px, calc(100vw - 32px)); border: 1px solid rgba(255,255,255,.1); border-radius: 24px; background: rgba(255,255,255,.05); padding: 32px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
          h1 { margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3rem); }
          p { margin: 0 0 14px; line-height: 1.6; color: #b5c2d9; }
          code { background: rgba(255,255,255,.08); padding: 2px 8px; border-radius: 999px; }
          a { color: #86efac; text-decoration: none; }
        </style>
      </head>
      <body>
        <main class="card">
          <h1>Smart Documentation Platform API</h1>
          <p>The backend is running. Use <code>/health</code> to verify status and <code>/api/projects</code> for project operations.</p>
          <p>Open the frontend at <a href="http://localhost:5174" target="_blank" rel="noreferrer">http://localhost:5174</a>.</p>
        </main>
      </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Smart Documentation Platform API" });
});

app.get("/api/projects", (req, res) => {
  res.json({ projects: listProjects() });
});

app.use("/api/projects", projectRouter);

app.use(errorHandler);
