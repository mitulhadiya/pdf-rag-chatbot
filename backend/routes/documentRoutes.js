import express from "express" ; 
import multer from "multer" ;
import {randomUUID} from "crypto" ;  
import {uploadDocument} from "../controllers/documentController.js" ;

import path from "node:path" ; 
import {fileURLToPath} from "node:url" ; 
import {mkdirSync} from "node:fs" ;

const currentFile = fileURLToPath(import.meta.url) ; 
const currentDirectory = path.dirname(currentFile) ; 

const router = express.Router() ; 

const uploadDirectory = path.resolve(currentDirectory,"../uploads") ; 
mkdirSync(uploadDirectory,{recursive:true}) ; 

const storage = multer.diskStorage({
    destination : (req,file,callback) => {
        callback(null,uploadDirectory) ; 
    } , 
    filename : (req,file,callback) => {
        callback(null,`${randomUUID()}.pdf`) ; 
    } , 
}) ; 

const fileFilter = (req,file,callback) => {
    const hasPdfExtension = path.extname(file.originalname).toLowerCase() === ".pdf" ; 
    if(file.mimetype === "application/pdf" && hasPdfExtension) {
        return callback(null,true) ; 
    }
    callback(new Error("Only PDF files are allowed.")) ;
} ;
const upload = multer({
    storage ,
    fileFilter ,
    limits : {
        fileSize : 10 * 1024 * 1024 ,
        files : 1 , 
    } ,
}) ;

router.post("/upload",upload.single("pdf"),uploadDocument) ; 

export default router ;