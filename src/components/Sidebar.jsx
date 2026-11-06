function Sidebar({pdfName,onFileChange,onNewChat}){
    return (
        <aside className="sidebar">
            <h2 className="brand">RAG CHATBOT</h2>
            <button className="new-chat" onClick={onNewChat}>
                + New Chat
            </button>
            <div className="sidebar-section">
                <p className="section-label">YOUR DOCUMENT</p>
                <label className="upload-button">
                    <span>+ Upload PDF</span>
                    <input 
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={onFileChange}
                        hidden
                    />
                </label>
                {pdfName && (
                    <div className="file-card">
                        <span>📄</span>
                        <span className="file-name">{pdfName}</span>
                    </div>
                )}
            </div>
            <div className="sidebar-footer">
                PDF RAG Chatbot 
                <br />
                Learning Project
            </div>
        </aside>
    ) ; 
}
export default Sidebar ;