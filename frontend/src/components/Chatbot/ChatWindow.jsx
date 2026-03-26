import React, { useState, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import { chatAPI } from "../../services/api";

const QUICK_ACTIONS = [
  { label: "📋 Check Order", message: "Order help" },
  { label: "📊 Statistics", message: "Statistics" },
  { label: "❓ Help", message: "help" },
];

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Tailor Assistant. How can I help you today?",
      sender: "bot",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      text: trimmed,
      sender: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const data = await chatAPI.send(trimmed);
      const botMsg = {
        id: Date.now() + 1,
        text: data.reply,
        sender: "bot",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = {
        id: Date.now() + 1,
        text: "Sorry, I couldn't connect to the server. Please try again.",
        sender: "bot",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickAction = (actionMessage) => {
    sendMessage(actionMessage);
  };

  return (
    <div className="chatbot-window">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-header-avatar">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 3.5C14.5 3.5 14.5 5.5 12 5.5C9.5 5.5 9.5 3.5 9.5 3.5" />
              <path d="M8.5 14.5C8.5 14.5 9.5 16 12 16C14.5 16 15.5 14.5 15.5 14.5" />
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <circle cx="9" cy="12" r="1" fill="currentColor" />
              <circle cx="15" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h3 className="chatbot-header-title">Tailor Assistant</h3>
            <span className="chatbot-header-status">
              <span className="chatbot-status-dot"></span>
              Online
            </span>
          </div>
        </div>
        <button
          className="chatbot-close-btn"
          onClick={onClose}
          aria-label="Close chat"
          id="chatbot-close-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="chatbot-quick-actions">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            className="chatbot-quick-btn"
            onClick={() => handleQuickAction(action.message)}
            id={`chatbot-quick-action-${i}`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="chatbot-messages" id="chatbot-messages-area">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="chatbot-message-row bot">
            <div className="chatbot-avatar">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 3.5C14.5 3.5 14.5 5.5 12 5.5C9.5 5.5 9.5 3.5 9.5 3.5" />
                <path d="M8.5 14.5C8.5 14.5 9.5 16 12 16C14.5 16 15.5 14.5 15.5 14.5" />
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <circle cx="9" cy="12" r="1" fill="currentColor" />
                <circle cx="15" cy="12" r="1" fill="currentColor" />
              </svg>
            </div>
            <div className="chatbot-bubble bot">
              <div className="chatbot-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chatbot-input-area">
        <input
          ref={inputRef}
          type="text"
          className="chatbot-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          id="chatbot-input"
        />
        <button
          className="chatbot-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
          id="chatbot-send-btn"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
