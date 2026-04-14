import { mkdir, readFile, writeFile } from "fs/promises";

const STORE_DIR = new URL("../../data/", import.meta.url);
const STORE_FILE = new URL("./projects.json", STORE_DIR);

let cache = {
  projects: []
};

let writeQueue = Promise.resolve();

async function ensureStoreDirectory() {
  await mkdir(STORE_DIR, { recursive: true });
}

async function readStoreFile() {
  try {
    const fileContents = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(fileContents);

    if (!parsed || !Array.isArray(parsed.projects)) {
      return { projects: [] };
    }

    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") {
      return { projects: [] };
    }

    throw error;
  }
}

async function writeStoreFile(nextState) {
  await ensureStoreDirectory();
  await writeFile(STORE_FILE, JSON.stringify(nextState, null, 2), "utf8");
}

export async function loadProjects() {
  cache = await readStoreFile();
  return cache.projects;
}

export function getCachedProjects() {
  return cache.projects;
}

export function replaceCachedProjects(nextProjects) {
  cache = { projects: nextProjects };

  writeQueue = writeQueue
    .then(() => writeStoreFile(cache))
    .catch((error) => {
      console.error("Failed to persist project store:", error);
    });

  return writeQueue;
}
