const API_BASE_URL = 
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000" ;

async function parseResponse(response){
    try {
        return await response.json() ; 
    }
    catch {
        throw new Error("Server returned an invalid response.")
    }
}
export async function uploadPDF(file) {
    const formData = new FormData() ; 
    formData.append("pdf",file) ; 
    const response = await fetch(
        `${API_BASE_URL}/api/documents/upload` ,
        {
            method : "POST" ,
            body : formData , 
        }
    ) ; 
    const data = await parseResponse(response) ;
    if(!response.ok){
        throw new Error(data.message || "PDF upload failed") ;
    }
    return data ; 
}

export async function askQuestion(question) {
    const response = await fetch(
        `${API_BASE_URL}/api/chat` ,
        {
            method : "POST" ,
            headers : {
                "Content-Type" : "application/json" , 
            } , 
            body : JSON.stringify({question}) , 
        }
    ) ; 
    const data = await parseResponse(response) ;
    if(!response.ok){
        throw new Error(data.message || "Failed to get an answer.") ;
    }
    return data ; 
}