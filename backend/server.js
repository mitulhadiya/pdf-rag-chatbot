import express from "express" ; 
import cors from "cors" ; 
import dotenv from "dotenv" ; 
import multer from "multer" ; 
import healthRoutes from "./routes/healthRoutes.js" ; 
import documentRoutes from "./routes/documentRoutes.js" ; 
import chatRoutes from "./routes/chatRoutes.js" ; 

import path from "node:path" ; 
import {fileURLToPath} from "node:url" ;

const currentFile = fileURLToPath(import.meta.url) ;
const currentDirectory = path.dirname(currentFile) ; 

dotenv.config({
    path: path.join(currentDirectory,".env") ,
}) ; 

const app = express() ; 
const PORT = process.env.PORT || 5000 ;

const allowedOrigins = [
    "http://localhost:5173" ,
    process.env.FRONTEND_URL ,  
].filter(Boolean)
app.use(
    cors({
        origin : allowedOrigins , 
    })
) ;

app.use(express.json()) ; 

app.use("/api/health",healthRoutes) ; 
app.use("/api/documents",documentRoutes) ; 
app.use("/api/chat",chatRoutes) ; 

app.use((error,req,res,next) => {
    if(error instanceof multer.MulterError){
        const message = error.code === "LIMIT_FILE_SIZE" ? "PDF must be 10MB or smaller." : error.message ;
        return res.status(400).json({
            success : false ,
            message , 
        }) ; 
    }
    if(error.message === "Only PDF files are allowed."){
        return res.status(400).json({
            success : false ,
            message : error.message , 
        }) ; 
    }
    console.error(error) ;
    return res.status(500).json({
        success : false ,
        message : "Something went wrong on the server." , 
    }) ;  
}) ;

app.listen(PORT,"0.0.0.0",() => {
    console.log(`Backend running on port ${PORT}`) ;
}) ; 