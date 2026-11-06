import express from "express" ; 
import {chatWithPDF} from "../controllers/chatController.js" ; 

const router = express.Router() ; 
router.post("/",chatWithPDF) ; 
export default router ;