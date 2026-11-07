import re
from pathlib import Path
from langchain_community.vectorstores import FAISS
from embeddings import embeddings

RAG_DIR = Path(__file__).resolve().parent
STORAGE_DIR = RAG_DIR / "storage"
GENERATIONS_DIR = STORAGE_DIR / "generations"

EMBEDDING_DIMENSION = 384

def get_generation_directory(generation_id) :
    if not isinstance(generation_id,str) :
        raise ValueError("Invalid generation ID.") 

    if not re.fullmatch(r"[a-f0-9-]{36}",generation_id,flags=re.IGNORECASE):
        raise ValueError("Invalid generation ID.")
    return GENERATIONS_DIR / generation_id

def build_and_save_index(chunks,generation_directory):
    if not chunks :
        raise ValueError("Cannot build an index without chunks.")

    generation_directory = Path(generation_directory)

    generation_directory.mkdir(
        parents = True ,
        exist_ok=True
    )

    vector_store = FAISS.from_documents(
        documents=chunks , 
        embedding=embeddings
    )

    if vector_store.index.d != EMBEDDING_DIMENSION :
        raise ValueError("Unexpected embedding dimension.") 

    vector_store.save_local(
        str(generation_directory / "faiss_index")
    )

    return len(chunks)

def load_vector_store(generation_id):
    generation_directory = get_generation_directory(
        generation_id
    )
    
    index_directory = generation_directory / "faiss_index"

    if not index_directory.exists() :
        raise ValueError("FAISS vector store not found.")

    vector_store = FAISS.load_local(
        str(index_directory) , 
        embeddings , 
        allow_dangerous_deserialization=True
    )

    if vector_store.index.d != EMBEDDING_DIMENSION :
        raise ValueError("Unexpected embedding dimension.") 
    
    return vector_store 

def search_chunks(question,generation_id,top_k=3) : 
    if not isinstance(question,str) or not question.strip():
        raise ValueError("Question cannot be empty.")

    if top_k <= 0 :
        raise ValueError("top_k must be positive.")
    vector_store = load_vector_store(generation_id)

    results = vector_store.similarity_search_with_score(
        question , 
        k = top_k
    )

    chunks = [] 

    for document , distance in results :
        chunks.append({
            "text" : document.page_content , 
            "page" : document.metadata.get("page",-1) + 1 ,
            "source" : document.metadata.get("source","") , 
            "chunk_id" : document.metadata.get("chunk_id") , 
            "start_index" : document.metadata.get("start_index") , 
            "score" : float(distance) ,
        })
    return chunks
