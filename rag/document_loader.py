from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader

def load_pdf(pdf_path) :

    pdf_path = Path(pdf_path)
    if not pdf_path.is_file() :
        raise FileNotFoundError(
            f"PDF not found : {pdf_path}"
        )
    if pdf_path.suffix.lower() != ".pdf" :
        raise ValueError(
            "Only PDF files are supported."
        )
    loader = PyPDFLoader(str(pdf_path))
    documents = loader.load()

    if not documents:
        raise ValueError(
            "No pages found in the PDF."
        )

    documents = [
        document
        for document in documents
        if document.page_content.strip()
    ]

    if not documents :
        raise ValueError(
            "No readable text found in this PDF."
            "It may require OCR."
        )
    return documents

if __name__ == "__main__" :
    pdf_path = input("Enter pdf Path : ").strip().strip('"').strip("'")
    try :
        documents = load_pdf(pdf_path)
        print("\nPDF loaded successfully!")
        print("Total readble pages : ",len(documents))
        for i , document in enumerate(documents[:3]):
            print(f"\n --- page {i+1} --- ")
            print("Metadata : ",document.metadata)
            print("Content : ")
            print(document.page_content[:500])
    except Exception as error :
        print("PDF loading failed : ",error)