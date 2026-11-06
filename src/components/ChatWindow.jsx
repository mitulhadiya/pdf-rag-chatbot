import ReactMarkdown from "react-markdown" ; 
import remarkGFM from "remark-gfm" ; 
function ChatWindow({messages,isLoading}){
    return (
        <section className="chat-area">
          {messages.length === 0 && !isLoading ? (
            <div className="welcome">
              <div className="welcome-icon">✦</div>
              <h2>Your document , understood.</h2>
              <p>
                Upload a PDF and ask questions about its content.
              </p>
              <div className="suggestion">
                "Summarize the main points of this document."
              </div>
              <div className="suggestion">
                "Explain an important concept with an example."
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message,index) => (
                <div 
                  className={`message ${message.role}`}
                  key={message.id ?? `${message.role}-${index}`}
                >
                  <span className="message-role">
                    {message.role === "user" ? "You" : "AI"} 
                  </span>
                  <div className="message-content">
                    <ReactMarkdown remarkPlugins={[remarkGFM]}>
                        {message.content}
                    </ReactMarkdown>
                  </div>
                  {Array.isArray(message.sources) && message.sources.length > 0 && (
                    <div className="message-sources">
                        <strong>Sources</strong>
                        {
                            message.sources.map((source,sourceIndex) => (
                                <div key={source.chunk_id ?? sourceIndex}>
                                    📄Page{source.page}
                                </div>
                            ))
                        }
                    </div>
                  )}
                </div>
              ))}
              {
                isLoading && (
                    <div className="message assistant loading-message">
                        <span className="message-role">AI</span>
                        <div className="typing-indicator" aria-label="AI is thinking" role="status">
                            <span />
                            <span />
                            <span />
                            <span className="loading-text">
                                Thinking...
                            </span>
                        </div>
                    </div>
                )
              }
            </div>
          )}
        </section>
    ) ;
} 
export default ChatWindow ; 