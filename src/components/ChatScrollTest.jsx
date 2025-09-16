import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const ChatScrollTest = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Add test messages to simulate a long conversation
  useEffect(() => {
    const testMessages = [];
    for (let i = 1; i <= 20; i++) {
      testMessages.push({
        id: i,
        message: `This is test message number ${i}. This message is long enough to test scrolling functionality. It should wrap to multiple lines and create enough content to make the scroll bar appear.`,
        sender: i % 2 === 0 ? 'user' : 'support',
        sent_at: new Date(Date.now() - (20 - i) * 60000).toISOString()
      });
    }
    setMessages(testMessages);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: messages.length + 1,
      message: newMessage,
      sender: 'user',
      sent_at: new Date().toISOString()
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
              <span className="text-sm font-bold">T</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scroll Test</h3>
              <p className="text-xs text-gray-500">Testing scroll functionality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area - Fixed scroll container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 chat-messages-container"
        style={{
          minHeight: '0',
          maxHeight: 'calc(100vh - 200px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#9ca3af #f1f5f9'
        }}
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-xl px-4 py-2 ${
                msg.sender === 'user' 
                  ? 'bg-green-600 text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">{msg.message}</div>
              <div className={`text-xs mt-1 text-right ${
                msg.sender === 'user' ? 'text-green-200' : 'text-gray-500'
              }`}>
                {formatTime(msg.sent_at)}
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} className="min-h-[1px]" />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          />
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-lg ${
              !newMessage.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScrollTest;
