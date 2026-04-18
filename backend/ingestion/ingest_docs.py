import hashlib

from ingestion.markdown_loader import load_documents
from ingestion.chunker import chunk_document

from services.embedding_service import embedding_service
from db.vector_store import vector_store


def hash_text(text: str):

    return hashlib.md5(text.encode()).hexdigest()


def ingest(base_path: str, project_id: str):

    docs = load_documents(base_path)

    all_chunks = []

    for doc in docs:

        chunks = chunk_document(doc)

        for c in chunks:
            c["project_id"] = project_id
            all_chunks.append(c)

    texts = [c["text"] for c in all_chunks]

    embeddings = embedding_service.embed(texts)

    vector_store.upsert(embeddings, all_chunks)

    print(f"Ingested {len(all_chunks)} chunks")
