import os
from app.course_loader import load_courses_from_json
from app.vector_store import VectorStore
from app.rag_engine import RAGEngine
from pathlib import Path

# Need to disable LangSmith telemetry if no api key was given
os.environ["LANGCHAIN_TRACING_V2"] = "false"

def main():
    course_file = Path("/Users/lazysince/AI-Advisor/backend/data/courses.json")
    if not course_file.exists():
        print(f"File not found: {course_file}")
        return
        
    print("Loading courses...")
    courses = load_courses_from_json(course_file)
    
    print("Initializing VectorStore...")
    # NOTE: In local dev outside Docker, ollama hosts on localhost
    vs = VectorStore(
        ollama_host="http://localhost:11434",
        persist_directory="./chroma_test"
    )
    vs.add_courses(courses)
    
    print("Initializing RAGEngine (ReAct)...")
    engine = RAGEngine(
        vector_store=vs,
        courses=courses,
        ollama_host="http://localhost:11434",
        chat_model="llama3.2",
    )
    
    print("\n--- Test 1: Simple Info Retrieval ---")
    res = engine.query("What are the prerequisites for COP3502?")
    print("Answer:", res['answer'])
    
    print("\n--- Test 2: Recommendation ---")
    res = engine.query("recommend me up to 10 credits of classes if I like machine learning and AI.")
    print("Answer:", res['answer'])

if __name__ == "__main__":
    main()
