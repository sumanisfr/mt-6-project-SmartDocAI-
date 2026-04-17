import re
import hashlib
from typing import List, Dict
from app.config import settings


def generate_id(text: str, path: str, idx: int) -> str:
    # deterministic + unique across docs
    raw = f"{path}-{idx}-{text}"
    return hashlib.md5(raw.encode()).hexdigest()


def chunk_document(doc: Dict) -> List[Dict]:

    text = doc["content"]

    sections = re.split(r"(#{1,6} .+)", text)

    chunks = []
    current_heading = "root"
    chunk_counter = 0

    for part in sections:

        if part.startswith("#"):
            current_heading = part.strip()
            continue

        words = part.split()

        for i in range(0, len(words), settings.CHUNK_SIZE):

            chunk_text = " ".join(
                words[i:i + settings.CHUNK_SIZE]
            )

            chunk_id = generate_id(chunk_text, doc["path"], chunk_counter)

            chunks.append({
                "id": chunk_id,                
                "text": chunk_text,
                "heading": current_heading,
                "source": doc["filename"],
                "path": doc["path"],
                "url": doc["path"],           
                "type": doc.get("type", "markdown")
            })

            chunk_counter += 1

    return chunks
