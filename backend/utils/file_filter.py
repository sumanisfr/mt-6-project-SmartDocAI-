IGNORE_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    "__pycache__",
    ".next",
    ".venv",
    "env"
}

IGNORE_FILES = {
    "package-lock.json",
    "yarn.lock",
    ".DS_Store"
}


def should_ignore(path_parts, filename):

    for part in path_parts:
        if part in IGNORE_DIRS:
            return True

    if filename in IGNORE_FILES:
        return True

    return False