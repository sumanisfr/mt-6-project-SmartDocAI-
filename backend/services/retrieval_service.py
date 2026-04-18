from services.embedding_service import embedding_service
from db.vector_store import vector_store
from app.config import settings


class RetrievalService:

    def retrieve(self, query, project_id):

      query_vector = embedding_service.embed([query])[0]

      results = vector_store.search(
        query_vector,
        project_id,
        settings.TOP_K
      )

      contexts = []

      for r in results:

        contexts.append({
            "text": r["text"],
            "source": r.get("source", ""),
            "heading": r.get("heading", ""),
            "url": r.get("url", "")
        })

      return contexts


retrieval_service = RetrievalService()
