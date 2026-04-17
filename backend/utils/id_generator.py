import hashlib
import time


def generate_project_id(seed: str):

    raw = f"{seed}-{time.time()}"

    return hashlib.md5(raw.encode()).hexdigest()