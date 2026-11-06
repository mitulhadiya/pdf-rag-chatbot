function ChatInput({question,onQuestionChange,onSubmit,disabled=false}){
    return (
       <form className="composer" onSubmit={onSubmit}>
            <input 
              type="text"
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              placeholder= {
                disabled ? "Upload a PDF to start" : "Ask a question..."
              }
              aria-label="Your question"
              disabled={disabled}
            />
            <button type="submit" disabled={disabled || !question.trim()}>
              Send ↑
            </button>
          </form> 
    ) ;
}
export default ChatInput ; 