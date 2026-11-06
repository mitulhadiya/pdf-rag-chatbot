import {spawn} from "node:child_process" ; 
import path from "node:path" ; 
import {getPythonExecutable,ragDirectory} from "../config/python.js" ; 

const pythonScript = path.join(ragDirectory,"generate_answer.py") ; 

export const chatWithPDF = (req,res) => {
    const {question} = req.body ?? {} ; 
    if(typeof question !== "string" || !question.trim()){
        return res.status(400).json({
            success : false , 
            message : "Please provide a question." , 
        }) ;
    }
    if(question.length > 5000){
        return res.status(400).json({
            success : false , 
            message : "Question must be 5000 characters or fewer." ,
        }) ;
    }
    const python = spawn(
        getPythonExecutable() ,
        [pythonScript] , 
        {
            cwd : ragDirectory ,
            shell : false ,
            windowsHide : true , 
            stdio : ["pipe","pipe","pipe"] ,
        }
    ) ;
    let stdout = "" ; 
    let stderr = "" ; 
    let finished = false ;
    const MAX_OUTPUT = 5_000_000 
    const timeout = setTimeout(() => {
        if (finished) return ;
        finished = true ;
        python.kill() ; 
        if(!res.headersSent){
            res.status(504).json({
                success : false ,
                message : "RAG processing timed out." , 
            }) ;
        }

    },120000) ; 
    const cleanup = () => clearTimeout(timeout) ; 

    python.stdout.setEncoding("utf-8") ; 

    python.stdout.on("data",(data) => {
        if(finished) return ;
        stdout += data ; 
        if(stdout.length > MAX_OUTPUT){
            finished = true ;
            cleanup()
            python.kill() ; 
            if(!res.headersSent){
                res.status(500).json({
                    success : false ,
                    message : "Python output exceeded the limit." , 
                }) ;
            }
        }
    }) ; 

    python.stderr.setEncoding("utf-8") ; 

    python.stderr.on("data",(data) => {
        stderr += data ; 
        if(stderr.length > 10000){
            stderr = stderr.slice(-10000) ;
        }
    }) ;
    python.on("error",(error) => {
        if(finished) return ;
        finished = true ;
        cleanup() ; 
        console.error("Could not start python.",error) ;
        if(!res.headersSent){
            res.status(500).json({
                success : false , 
                message : "Could not start the python RAG process." ,
            }) ; 
        }
    }) ; 
    python.on("close",(code)=>{
        if(finished) return ; 
        finished = true ; 
        cleanup() ; 
        if(code !== 0){
            console.error("Python RAG failed : ",stderr) ; 
            return res.status(500).json({
                success : false ,
                message : "Failed to generate an answer." ,
            }) ; 
        }
        try {
            const result = JSON.parse(stdout.trim()) ;

            if(result.success === false) {
                return res.status(400).json({
                    success : false ,
                    message : result.message || "Unable to process your question." , 
                }) ;
            }
            if (
                typeof result.answer !== "string" || 
                !Array.isArray(result.sources)
            ){
                throw new Error(
                    "Missing answer or sources in python response."
                ) ;
            }
            return res.status(200).json({
                success : true ,
                answer : result.answer , 
                sources : result.sources , 
            }) ; 
        }
        catch(error){
            console.error("Python returned an invalid response : ",error) ;
            return res.status(500).json({
                success : false , 
                message : "Python returned an invalid response." ,
            }) ; 
        } 
    }) ;

    python.stdin.end(JSON.stringify({
        question : question.trim()  ,
    })) ; 
} ;