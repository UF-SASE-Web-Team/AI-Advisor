import logging
import chromadb
from chromadb.config import Settings
import ollama

from app.course_loader import Course

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(
        self,
        ollama_host: str = "http://localhost:11434",
        embedding_model: str = "nomic-embed-text",
        persist_directory: str = "/app/data/chroma",
    ):
        self.ollama_host = ollama_host
        self.embedding_model = embedding_model
        self.ollama_client = ollama.Client(host=ollama_host)

        # Initialize ChromaDB with persistence
        self.chroma_client = chromadb.Client(Settings(
            persist_directory=persist_directory,
            anonymized_telemetry=False,
            is_persistent=True,
        ))

        self.collection = self.chroma_client.get_or_create_collection(
            name="courses",
            metadata={"hnsw:space": "cosine"}
        )

        logger.info(f"Vector store initialized with {self.collection.count()} documents")

    def _get_embedding(self, text: str) -> list[float]:
        # Get embedding with Ollama
        response = self.ollama_client.embed(
            model=self.embedding_model,
            input=text
        )
        return response['embeddings'][0]

    def add_courses(self, courses: list[Course]) -> int:
        # adding the courser to vector store
        if not courses:
            return 0

        # check if already populated
        if self.collection.count() > 0:
            logger.info("Collection already has documents, skipping ingestion")
            return self.collection.count()

        # Keep first occurance
        seen_codes = set()
        unique_courses = []
        for course in courses:
            if course.code not in seen_codes:
                seen_codes.add(course.code)
                unique_courses.append(course)

        logger.info(f"Deduplicated {len(courses)} courses to {len(unique_courses)} unique courses")

        documents = []
        ids = []
        metadatas = []

        for course in unique_courses:
            doc_text = course.to_document()
            documents.append(doc_text)
            ids.append(course.code)
            metadatas.append({
                "code": course.code,
                "name": course.name,
                "department": course.department,
                "credits": course.credits,
            })

        # Generate embeddings in batches
        logger.info(f"Generating embeddings for {len(documents)} courses...")
        embeddings = []
        batch_size = 50

        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            logger.info(f"Processing batch {i // batch_size + 1}/{(len(documents) + batch_size - 1) // batch_size}")

            for doc in batch:
                embedding = self._get_embedding(doc)
                embeddings.append(embedding)

        # Add to collection
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas,
        )

        logger.info(f"Added {len(documents)} courses to vector store")
        return len(documents)

    def search(self, query: str, n_results: int = 5) -> list[dict]:
        query_embedding = self._get_embedding(query)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )

        search_results = []
        if results and results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                distance = results['distances'][0][i] if results['distances'] else 0

                # distance -> similarity score
                similarity = 1 - distance

                search_results.append({
                    "content": doc,
                    "course_code": metadata.get("code", ""),
                    "course_name": metadata.get("name", ""),
                    "relevance_score": similarity,
                })

        return search_results

    def clear(self):
        # clear doc from collection
        self.chroma_client.delete_collection("courses")
        self.collection = self.chroma_client.get_or_create_collection(
            name="courses",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("Vector store cleared")
