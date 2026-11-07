import {spawn} from "node:child_process" ;
import path from "node:path" ;
import {getPythonExecutable,ragDirectory} from "../config/python.js" ; 
import {unlink} from "node:fs/promises" ; 

const pythonScript = path.join(
    ragDirectory , 
    "build_index.py"
)

function runPython(pdfPath,originalName){
    return new Promise((resolve,reject) => {
        const python = spawn(
            getPythonExecutable() , 
            [pythonScript , 
                pdfPath ,
                originalName , 
            ] , 
            {
                cwd : ragDirectory , 
                shell : false , 
                windowsHide : true , 
                stdio : ["ignore","pipe","pipe"]
            } , 
        ) ; 

        let stdout = "" ; 
        let stderr = "" ; 

        let settled = false ; 
        const MAX_OUTPUT = 5_000_000 ; 

        const timeout = setTimeout(() => {
            if(settled) return ;
            settled = true ;
            python.kill() ;
            reject(
                new Error("PDF indexing timed out.")
            )
        },300000)
        python.stdout.setEncoding("utf8") ; 

        python.stdout.on("data",(data) => {
            stdout += data ;
            
            if (stdout.length > MAX_OUTPUT){
                python.kill() ;
                if(!settled){
                    settled = true ; 
                    clearTimeout(timeout) ; 
                    reject(
                        new Error("Python output exceed the limit.")
                    ) ;
                }
            }
        }) ;

        python.stderr.setEncoding("utf8") ; 

        python.stderr.on("data", data => {
            const output = data.toString() ; 
            stderr += data ;
            process.stderr.write(output) ; 
            if (stderr.length > MAX_OUTPUT){
                python.kill() ;
                if(!settled){
                    settled = true ; 
                    clearTimeout(timeout) ; 
                    reject(
                        new Error("Python error otput exceed the limit.")
                    ) ;
                }
            }
        }) ;

        python.on("error",(error) => {
            if(settled) return ;
            settled = true ;
            clearTimeout(timeout) ; 
            reject(error) ; 
        }) ; 
        python.on("close",code => {
            if(settled) return ;
            settled = true ; 
            clearTimeout(timeout) ; 
            if(code != 0){
                reject(new Error(stderr.trim() || `Python process exited with code ${code}`)) ; 
                return ;
            }
            try {
                const result = JSON.parse(stdout.trim()) ; 
                if(!result.success){
                    reject(new Error(result.error || "PDF indexing failed.")) ;  
                    return ;
                }
                resolve(result) ;
            }
            catch(error){
                reject(new Error(`Invalid respose from python : ${error.message}`)) ; 
            }
        }) ;
    }) ; 
}

export const uploadDocument = async (req,res) => {
    if(!req.file){
        return res.status(400).json({
            success : false , 
            message : "Please upload a PDF file."
        })
    }
    const uploadedFilePath = req.file.path ; 
    try {
        const result = await runPython(
            uploadedFilePath , 
            req.file.originalname
        ) ; 
        return res.status(201).json({
            success : true , 
            message : "PDF uploaded successfully" , 
            document : {
                filename : req.file.filename , 
                originalName : result.original_name , 
                pageCount : result.page_count ,
                chunkCount : result.chunk_count ,
                generation : result.generation_id ,
            } ,
        }) ; 
    }
    catch(error){
        console.error("PDF indexing error : ",error) ;
        return res.status(500).json({
            success : false ,
            message : "Failed to upload or indexing PDF" ,
            error : error.message
        }) ; 
    } 
    finally {
        try {
            await unlink(uploadedFilePath) ;
        }
        catch(error){
            if (error.code !== "ENOENT") {
                console.error (
                    "Temporary PDF cleanup failed : " , 
                    error , 
                ) ;
            }
        }
    }
} ;