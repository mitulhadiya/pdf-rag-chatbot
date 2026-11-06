import os
import sys 
import json
import shutil
import uuid
from pathlib import Path
from pypdf import PdfReader

from document_loader import load_pdf
from text_splitter import split_documents
from vector_store import build_and_save_index

RAG_DIR = Path(__file__).resolve().parent
STORAGE_DIR = RAG_DIR / "storage"
GENERATIONS_DIR = STORAGE_DIR / "generations"
CURRENT_MANIFEST = STORAGE_DIR / "current.json"

def activate_generation(manifest_data):
    STORAGE_DIR.mkdir(parents=True,exist_ok=True)
    temporary_manifest =(
        STORAGE_DIR / f"current-{uuid.uuid4().hex}.tmp"
    )
    try :
        with open(
            temporary_manifest , 
            "w" ,
            encoding="utf-8" ,
        ) as file : 
            json.dump(
                manifest_data,
                file ,
                ensure_ascii=False , 
                indent=4
            )
            file.flush()
            os.fsync(file.fileno())
        os.replace(
            temporary_manifest , 
            CURRENT_MANIFEST ,
        )
    finally :
        if temporary_manifest.exists() :
            temporary_manifest.unlink()

def cleanup_old_generations(active_generations):
    if not GENERATIONS_DIR.exists():
        return 
    for directory in GENERATIONS_DIR.iterdir():
        if not directory.is_dir() :
            continue
        if directory.name == active_generations:
            continue
        try :
            shutil.rmtree(directory)
        except OSError as error : 
            print(
                f"Could not remove old generation {directory.name} : {error}" , 
                file=sys.stderr
            )

def build_index(pdf_path,original_name):
    pdf_path = Path(pdf_path).resolve()

    if not pdf_path.is_file():
        raise FileNotFoundError(f"Uploaded PDF was not found :  {pdf_path}")

    if pdf_path.suffix.lower() != ".pdf" : 
        raise ValueError("Only PDF files are supported.")

    STORAGE_DIR.mkdir(parents=True,exist_ok=True)
    GENERATIONS_DIR.mkdir(parents=True,exist_ok=True)

    old_generation = None

    if CURRENT_MANIFEST.exists():
        with open(CURRENT_MANIFEST,"r",encoding="utf-8") as file :
            old_manifest = json.load(file)
            old_generation = old_manifest.get("generation")

    generation_id = str(uuid.uuid4())

    generation_directory = (
        GENERATIONS_DIR / generation_id
    )

    generation_directory.mkdir(
        parents=True , 
        exist_ok=False  ,
    )

    try : 
        stored_pdf = generation_directory / "current.pdf"

        shutil.copy2(
            pdf_path , 
            stored_pdf , 
        )

        page_count = len(
            PdfReader(str(stored_pdf)).pages
        )

        if page_count == 0:
            raise ValueError("The uploaded PDF has no pages.")

        documents = load_pdf(stored_pdf)



        chunks = split_documents(
            documents ,
            chunk_size = 1000 ,
            chunk_overlap=150
        )

        if not chunks :
            raise ValueError("No chunks were created.")

        for chunk in chunks:
            page_number = chunk.metadata.get("page",0) + 1
            chunk.metadata["page_label"] = str(page_number)
        
        chunk_count = build_and_save_index(chunks,generation_directory)

        manifest_data = {
            "generation" : generation_id , 
            "original_name" : original_name , 
            "page_count" : page_count , 
            "chunk_count" : chunk_count
        }

        activate_generation(manifest_data)

        cleanup_old_generations(generation_id)

        return {
            "success" : True , 
            "generation_id" : generation_id, 
            "original_name" : original_name ,
            "page_count" : page_count , 
            "chunk_count" : chunk_count , 
        }
    except Exception :
        if generation_directory.exists():
            shutil.rmtree(
                generation_directory , 
                ignore_errors=True , 
            )
        raise 

if __name__ == "__main__" :

    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

    try : 
        if len(sys.argv) != 3:
            raise ValueError("Usage : python build_index.py <pdf_path> <original_filename>")
        
        uploaded_pdf_path = sys.argv[1]
        original_filename = sys.argv[2]
        result = build_index(uploaded_pdf_path,original_filename)
        print(
            json.dumps(
                result ,
                ensure_ascii=False ,
            )
        )   
    except Exception as error :
        print(
            json.dumps({
                "success" : False ,
                "error" : str(error) ,
            }) ,
            file=sys.stderr
        )
        sys.exit(1)