import {useState} from "react" ;
import "./App.css" ;
import {uploadPDF , askQuestion} from "./api.js" ;
import Sidebar from "./components/Sidebar" ;
import ChatInput from "./components/ChatInput" ;
import ChatWindow from "./components/ChatWindow";

function App(){
  const [question,setQuestion] = useState("") ;
  const [messages,setMessages] = useState([]) ; 
  const [pdfName,setPdfName] = useState("") ;
  const [isLoading,setIsLoading] = useState(false) ;
  const [isUploading,setIsUploading] = useState(false) ; 
  const handleFileChange = async (event) => {
    if(isLoading || isUploading) {
      alert("Please wait until the current operation finishes.") ; 
      event.target.value = "" ;
      return ;
    }
    const file = event.target.files?.[0] ;

    if(!file) return ;

    if(!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file") ;
      event.target.value = "" ; 
      return ;
    }

    if(file.size > 10 * 1024 * 1024) {
      alert("PDF must be 10 MB or smaller") ;
      event.target.value = "" ; 
      return ;
    }

    try{
      setIsUploading(true) ;
      console.log("Uploading PDF :",file.name) ;
      const result = await uploadPDF(file) ;
      setPdfName(result.document.originalName) ; 
      setMessages([]) ; 
      setQuestion("") ; 
      console.log("PDF indexing result : ",result) ;
      alert(
        `PDF uploaded and indexed successfully! \n\nPages:${result.document.pageCount}\nChunks : ${result.document.chunkCount}`
      ) ;
    }
    catch(error){
      console.error("PDF upload error",error) ; 
      alert(error.message || "Could not upload PDF") ; 
    }
    finally {
      setIsUploading(false) ; 
      event.target.value = "" ; 
    }
  } ; 
  const handleSendMessage = async (question) => {
    const trimmedQuestion = question.trim() ;
    if(!trimmedQuestion || isLoading || isUploading) return ;

    if(!pdfName){
      alert("Please upload a PDF first.") ; 
      return ;
    }
    setMessages((previous) => [
      ...previous , 
      {
        id : crypto.randomUUID() , 
        role : "user" , 
        content : trimmedQuestion , 
      } ,
    ]) ;
    setIsLoading(true) ; 
    try{
      const result = await askQuestion(trimmedQuestion) ;
      setMessages((previous) => [
        ...previous ,
        {
          id : crypto.randomUUID() ,
          role : "assistant" ,
          content : result.answer ,
          sources : result.sources ?? [] ,
        } ,
      ]) ; 
    }
    catch(error){
      console.error(error) ; 
      setMessages((previous) => [
        ...previous , 
        {
          id : crypto.randomUUID() , 
          role : "assistant" , 
          content : error.message || "Something went wrong." , 
          sources : [] , 
        } , 
      ]) ; 
    }
    finally{
      setIsLoading(false) ; 
    }
  } ; 
  async function handleSubmit(event){
    event.preventDefault() ; 

    const trimmedQuestion = question.trim() ;

    if(!trimmedQuestion) return ;

    if(!pdfName) {
      alert("Please upload a PDF first.") ;
      return ; 
    }
    if(isLoading || isUploading) return ;
    setQuestion("") ; 
    await handleSendMessage(trimmedQuestion) ;
  }
  function handleNewChat(){
    setMessages([]) ; 
    setQuestion("") ;
  }
  return (
    <div className="app">
      <Sidebar
        pdfName={pdfName}
        onFileChange={handleFileChange}
        onNewChat={handleNewChat}
      />
      <main className="main">
        <header className="topbar">
          <div>
            <h1>Chat with your PDF</h1>
            <p>Ask questions about your documents.</p>
          </div>
          <span className="status">{pdfName ? "Connected" : "No PDF"}</span>
        </header>

        <ChatWindow messages={messages} isLoading={isLoading} />
        
        <div className="composer-wrapper">
          {!pdfName && (
            <p className="hint">
              Upload a pdf to prepare for document-based questions.
            </p>
          )} 

          {isUploading &&(
            <p className="hint">
              Uploading PDF and building FAISS index.
              Please wait...
            </p>
          )}

          {pdfName && !isUploading && (
            <p className="hint">
              Active document : {pdfName}
            </p>
          )}

          <ChatInput
            question={question}
            onQuestionChange={setQuestion}
            onSubmit={handleSubmit}
            disabled={!pdfName || isLoading || isUploading}
          />
          <p className="disclaimer">
            Answer are generated using your uploaded PDF
            and may contain mistakes...
          </p>
        </div>
      </main>
    </div>
  ) ; 
}
export default App ; 