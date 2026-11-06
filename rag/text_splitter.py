from langchain_text_splitters import RecursiveCharacterTextSplitter
def split_documents(documents,chunk_size=1000,chunk_overlap=150):
    if not documents :
        raise ValueError("No documents provided.")

    if chunk_size <= 0 :
        raise ValueError("chunk_size must be positive.")

    if chunk_overlap < 0 or chunk_overlap >= chunk_size :
        raise ValueError(
            "chunk_overlap must be non-negative "
            "and smaller then chunk_size."
        )
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = chunk_size , 
        chunk_overlap = chunk_overlap , 
        length_function = len ,
        separators = ["\n\n","\n"," ",""] ,
        add_start_index = True ,
    )
    chunks = splitter.split_documents(documents)

    if not chunks :
        raise ValueError("No chunks were created.")

    return chunks

if __name__ == "__main__" :
    from document_loader import load_pdf
    pdf_path = input("Enter pdf Path : ").strip().strip('"').strip("'")
    try :
        documents = load_pdf(pdf_path)
        print("\nOriginal pages : ",len(documents))

        chunks = split_documents(
            documents , 
            chunk_size=1000 ,
            chunk_overlap=150
        )
        print("Total chunks : ",len(chunks))
        for i , chunk in enumerate(chunks[:3]):
            print(f"\n --- page {i+1} --- ")
            print("Metadata : ",chunk.metadata)
            print("Content : ")
            print(chunk.page_content[:500])
    except Exception as error :
        print("PDF loading failed : ",error)