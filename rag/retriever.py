import json
from pathlib import Path
from vector_store import load_vector_store

RAG_DIR  = Path(__file__).resolve().parent

STORAGE_DIR = RAG_DIR / "storage"

CURRENT_MANIFEST = STORAGE_DIR / "current.json"

def get_active_generation():
    if not CURRENT_MANIFEST.exists():
        raise FileNotFoundError(
            "No active PDF found. Please upload a PDF first."
        )
    with open(
        CURRENT_MANIFEST , 
        "r" ,
        encoding="utf-8" , 
    ) as file :
        manifest = json.load(file)

    generation_id = manifest.get("generation")

    if not generation_id :
        raise ValueError(
            "Active generation ID is missing."
        )
    return generation_id

def get_retriever(k=3,search_type="similarity"):
    if  k <= 0:
        raise ValueError("k must be positive.")
    generation_id = get_active_generation()
    vector_store = load_vector_store(
        generation_id
    )
    retriever = vector_store.as_retriever(
        search_type=search_type , 
        search_kwargs={
            "k" : k
        }
    )
    return retriever
def retrieve_documents(question,k=3) :
    if not isinstance(question,str) or not question.strip() :
        raise ValueError("Question cannot be empty.")
    retriever = get_retriever(
        k = k , 
        search_type="similarity"
    )
    documents = retriever.invoke(question)
    results = []
    for document in documents :
        results.append({
            "text" : document.page_content , 
            "page" : document.metadata.get("page",-1) +1 ,
            "source" : document.metadata.get("source","") ,
            "start_index" : document.metadata.get("start_index")  
        })
    return results

if __name__ == "__main__":

    question = input("Ask a question about your PDF: ")

    try:

        results = retrieve_documents(
            question,
            k=3
        )

        if not results:
            print("No relevant documents found.")

        for i, result in enumerate(results, start=1):

            print(f"\n========== RESULT {i} ==========")

            print("Page:", result["page"])

            print("Source:", result["source"])

            print("Content:")

            print(result["text"])

    except Exception as error:

        print("Retrieval failed:", error)
