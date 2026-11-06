from langchain_huggingface import HuggingFaceEmbeddings

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

embeddings = HuggingFaceEmbeddings(
    model_name = MODEL_NAME ,
    model_kwargs = {
        "device" : "cpu"
    } ,
    encode_kwargs = {
        "normalize_embeddings" : True
    }
)

def embed_document(chunks) :
    if not chunks:
        raise ValueError("No chunks provided.")
    texts = [chunk.page_content for chunk in chunks]

    vectors = embeddings.embed_documents(texts)
    return vectors

def embed_query(question):
    if not isinstance(question,str) or not question.strip() :
        raise ValueError("Question cannot be empty.")
    
    vector = embeddings.embed_query(question)
    return vector

if __name__ == "__main__":
    sample_texts = [
        "Machine learning is a subset of artificial intelligence.",
        "Deep learning uses neural networks.",
        "Photosynthesis converts light energy into chemical energy."
    ]

    print("Generating document embeddings...")

    document_vectors = embeddings.embed_documents(sample_texts)

    print("Number of document vectors : ",len(document_vectors))

    print("Document embedding dimension : ",len(document_vectors[0]))

    question = "What is machine learning"

    print("\nGenerating query embeddings...")

    query_vector = embeddings.embed_query(question)
    
    print("Query embedding dimension : ",len(query_vector))

    print("\nFirst five document vector values:")

    print(document_vectors[0][:5])

    print("\nFirst five query vector values:")
    
    print(query_vector[:5])