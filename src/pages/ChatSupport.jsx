import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = '/backend/api/chat.php';

const recommendedQuestions = [
  'How do I check compatibility?',
  'Can I save my PC build?',
  'Are prices up to date?',
  'How do I place an order?',
  'What payment methods do you accept?',
  'Do you offer warranty?',
  'Can I customize prebuilt PCs?'
];

const ChatSupport = ({ setCurrentPage, user, customStyles = {}, hideHeader = false }) => {
  // Session management
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('builditpc_chat_session_id') || null;
  });
  const [guestName, setGuestName] = useState(() => localStorage.getItem('builditpc_guest_name') || '');
  const [guestEmail, setGuestEmail] = useState(() => localStorage.getItem('builditpc_guest_email') || '');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('open');
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const messagesEndRef = useRef(null);
  const [tempGuestName, setTempGuestName] = useState('');
  const [tempGuestEmail, setTempGuestEmail] = useState('');

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (!sessionId) return;
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}?messages&session_id=${sessionId}${user ? `&user_id=${user.id}` : ''}`);
        const data = await res.json();
        if (data.success) {
          const newMessages = data.messages || [];
          setMessages(newMessages);
          
          // Check for new messages
          if (newMessages.length > 0) {
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessageTime !== lastMessage.sent_at) {
              setLastMessageTime(lastMessage.sent_at);
              // Scroll to bottom for new messages
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }
          
          // Update unread count
          const unreadMessages = newMessages.filter(msg => 
            msg.sender === 'admin' && msg.read_status === 'unread'
          ).length;
          setUnreadCount(unreadMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [sessionId, user, lastMessageTime]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save guest info
  useEffect(() => {
    if (guestName) localStorage.setItem('builditpc_guest_name', guestName);
    if (guestEmail) localStorage.setItem('builditpc_guest_email', guestEmail);
  }, [guestName, guestEmail]);

  // Create a new chat session in the backend
  const createSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}?send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: null,
          sender: 'user',
          message: newMessage,
          guest_name: !user ? guestName : undefined,
          guest_email: !user ? guestEmail : undefined,
          user_id: user ? user.id : undefined
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Get the session ID from the response
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem('builditpc_chat_session_id', data.session_id);
        setSessionStatus('open');
      }
      
      setNewMessage('');
    } catch (e) {
      setError('Failed to start chat session: ' + e.message);
    }
    setLoading(false);
  };

  // Send a message to the backend
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    setError(null);
    
    try {
      if (!sessionId) {
        await createSession();
        return;
      }
      
      const res = await fetch(`${API_BASE}?send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          sender: 'user',
          message: newMessage
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setNewMessage('');
      setIsTyping(false);
    } catch (e) {
      setError('Failed to send message: ' + e.message);
    }
    setLoading(false);
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };

  // Clear conversation
  const clearConversation = async () => {
    if (!window.confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
      return;
    }
    
    try {
      await fetch(`${API_BASE}?delete_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      setSessionId(null);
      localStorage.removeItem('builditpc_chat_session_id');
      setMessages([]);
      setUnreadCount(0);
      setSessionStatus('open');
    } catch (error) {
      setError('Failed to clear conversation');
    }
  };

  // Guest info form
  if (!user && !guestName) {
    const handleGuestContinue = () => {
      if (!tempGuestName.trim()) return;
      setGuestName(tempGuestName.trim());
      if (tempGuestEmail.trim()) {
        setGuestEmail(tempGuestEmail.trim());
      }
    };
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border">
          <div className="text-center mb-6">
            <MessageSquare className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Chat Support</h2>
            <p className="text-gray-600">Get help from our expert team</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your name"
                value={tempGuestName}
                onChange={e => setTempGuestName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGuestContinue(); }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
                value={tempGuestEmail}
                onChange={e => setTempGuestEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGuestContinue(); }}
              />
            </div>
            
            <button
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGuestContinue}
              disabled={!tempGuestName.trim()}
            >
              Start Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 rounded-lg shadow-md border">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-lg">
          <MessageSquare className="w-8 h-8" />
          <div className="flex-1">
            <div className="font-bold text-lg">SIMS Support</div>
            <div className="text-xs opacity-90 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Online
              </div>
              <span>•</span>
              <span>Fast response</span>
              {sessionStatus === 'resolved' && (
                <>
                  <span>•</span>
                  <span className="text-yellow-300">Resolved</span>
                </>
              )}
            </div>
          </div>
          
          {/* Session controls */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                {unreadCount} new
              </div>
            )}
            
            {sessionId && (
              <button
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition text-sm font-semibold"
                title="Clear Conversation"
                onClick={clearConversation}
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Quick Suggestions */}
      {messages.length === 0 && (
        <div className="bg-green-50 px-6 py-4 flex flex-wrap gap-2 border-b">
          <div className="w-full text-sm text-gray-600 mb-2">Quick questions:</div>
          {recommendedQuestions.map((q, i) => (
            <button
              key={i}
              className="px-3 py-2 bg-white border border-green-200 rounded-lg text-green-700 text-sm hover:bg-green-100 transition-colors"
              onClick={() => setNewMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}
      
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${customStyles.messagesArea || ''}`}>
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="text-lg font-medium">No messages yet</div>
            <div className="text-sm">Start the conversation by typing a message below!</div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`group relative rounded-2xl px-4 py-3 max-w-xs lg:max-w-md shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-green-500 text-white' 
                : msg.message_type === 'system'
                ? 'bg-gray-100 text-gray-600 border border-gray-200'
                : 'bg-white border border-gray-200'
            }`}>
              {/* Message content */}
              <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
              
              {/* Message metadata */}
              <div className={`flex items-center justify-between mt-2 text-xs ${
                msg.sender === 'user' ? 'text-green-100' : 'text-gray-500'
              }`}>
                <span>{msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : ''}</span>
                
                {/* Read status for user messages */}
                {msg.sender === 'user' && (
                  <div className="flex items-center gap-1">
                    {msg.read_status === 'read' ? (
                      <CheckCircle className="w-3 h-3" title="Read" />
                    ) : (
                      <Clock className="w-3 h-3" title="Delivered" />
                    )}
                  </div>
                )}
                
                {/* Message type indicator */}
                {msg.message_type !== 'text' && (
                  <div className="flex items-center gap-1">
                    {msg.message_type === 'system' && <AlertCircle className="w-3 h-3" />}
                    <span className="capitalize">{msg.message_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className={`p-4 pb-6 px-4 border-t flex items-center gap-2 rounded-b-lg ${customStyles.inputArea || 'bg-white'}`}>
        <input
          type="text"
          className="flex-1 min-w-0 border border-gray-300 rounded-full px-4 py-3 mr-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder={sessionStatus === 'resolved' ? 'Chat resolved. Start a new conversation...' : 'Type your message...'}
          value={newMessage}
          onChange={handleTyping}
          onKeyDown={e => { 
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(); 
            }
          }}
          disabled={loading || sessionStatus === 'resolved'}
        />
        <button
          className={`rounded-full font-semibold flex items-center gap-2 transition-colors min-w-[90px] justify-center px-4 py-3 ${
            loading || sessionStatus === 'resolved'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          onClick={sendMessage}
          disabled={loading || sessionStatus === 'resolved'}
        >
          <Send className="w-5 h-5" /> 
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-center text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ChatSupport; 