from pathlib import Path
from app.config import settings


IGNORE_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "__pycache__",
    ".venv",
    "venv"
}


def extract_headings(content):

    headings = []

    for line in content.split("\n"):
        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            text = line.strip("# ").strip()

            headings.append({
                "level": level,
                "text": text
            })

    return headings

def generate_sidebar():

    base = Path(settings.DOCS_PATH)
    sidebar = []

    for file in base.rglob("*.md"):
        relative_parts = file.relative_to(base).parts

        if any(part in IGNORE_DIRS for part in file.parts):
            continue

        with open(file, "r", encoding="utf-8") as f:
            content = f.read()

        headings = extract_headings(content)

        sidebar.append({
            "title": file.stem,
            "path": str(file),
            "headings": headings
        })

    return sidebar

    
