from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance,PayloadSchemaType, PointStruct,  Filter, FieldCondition, MatchValue

from app.config import settings


class VectorStore:

    def __init__(self):

       if settings.QDRANT_URL:
            # Production (Cloud)
            self.client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY
            )
       else:
            # Local (Dev)
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT
            )

       self.collection = settings.QDRANT_COLLECTION

       self._create_collection()

    def _create_collection(self):

     try:
        self.client.get_collection(self.collection)

     except Exception:

        self.client.create_collection(
            collection_name=self.collection,
            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE
            )
        )

    # ALWAYS ensure index exists (important)
     try:
        self.client.create_payload_index(
            collection_name=self.collection,
            field_name="project_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
     except Exception:
        # index may already exist, safe to ignore
        pass

    def upsert(self, vectors, payloads):

     points = []

     for i, vector in enumerate(vectors):

        payload = payloads[i]

        points.append(
            PointStruct(
                id=payload["id"],
                vector=vector,
                payload=payload
            )
        )

     self.client.upsert(
        collection_name=self.collection,
        points=points
     )

    def search(self, vector, project_id, limit=5):

        results = self.client.query_points(
        collection_name=self.collection,
        query=vector,
        limit=limit,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="project_id",
                    match=MatchValue(value=project_id))
                ]
            )
        )

        return [point.payload for point in results.points]


vector_store = VectorStore()
