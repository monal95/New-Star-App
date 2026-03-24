import React from "react";

const ChatMessage = ({ message }) => {
  const isUser = message.sender === "user";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`chatbot-message-row ${isUser ? "user" : "bot"}`}>
      {!isUser && (
        <div className="chatbot-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 3.5C14.5 3.5 14.5 5.5 12 5.5C9.5 5.5 9.5 3.5 9.5 3.5" />
            <path d="M8.5 14.5C8.5 14.5 9.5 16 12 16C14.5 16 15.5 14.5 15.5 14.5" />
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <circle cx="9" cy="12" r="1" fill="currentColor" />
            <circle cx="15" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
      )}
      <div className={`chatbot-bubble ${isUser ? "user" : "bot"}`}>
        <p className="chatbot-bubble-text">{message.text}</p>
        <span className="chatbot-bubble-time">{time}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
