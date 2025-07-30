import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, Trash2 } from 'lucide-react';

const API_BASE = '/backend/api/chat.php';

const recommendedQuestions = [
  'How do I check compatibility?',
  'Can I save my PC build?',
  'Are prices up to date?',
  'How do I place an order?',
  'What payment methods do you accept?'
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
  const messagesEndRef = useRef(null);
  const [tempGuestName, setTempGuestName] = useState('');

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!sessionId) return;
    const fetchMessages = () => {
      fetch(`${API_BASE}?messages&session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => setMessages(data.messages || []));
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

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
          user_id: user ? user.id : undefined
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Fetch sessions to get the new session ID
      const sessionsRes = await fetch(`${API_BASE}?sessions`);
      const sessionsData = await sessionsRes.json();
      // Find the latest session for this guest/user
      let session = null;
      if (user) {
        session = (sessionsData.sessions || []).find(s => String(s.user_id) === String(user.id));
      } else {
        session = (sessionsData.sessions || []).find(s => s.guest_name === guestName);
      }
      if (session) {
        setSessionId(session.id);
        localStorage.setItem('builditpc_chat_session_id', session.id);
      }
      setNewMessage('');
    } catch (e) {
      setError('Failed to start chat session.');
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
      await fetch(`${API_BASE}?send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          sender: 'user',
          message: newMessage
        })
      });
      setNewMessage('');
    } catch (e) {
      setError('Failed to send message.');
    }
    setLoading(false);
  };

  // Guest info form
  if (!user && !guestName) {
    const handleGuestContinue = () => {
      setGuestName(tempGuestName.trim());
    };
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Start Chat as Guest</h2>
          <input
            type="text"
            className="border rounded px-3 py-2 mb-3 w-full"
            placeholder="Your Name"
            value={tempGuestName}
            onChange={e => setTempGuestName(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
            onClick={handleGuestContinue}
            disabled={!tempGuestName}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 rounded-lg shadow-md border">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-4 bg-green-600 text-white px-6 py-4 rounded-t-lg">
          <MessageSquare className="w-8 h-8" />
          <div>
            <div className="font-bold text-lg">BUILD IT:PC Support</div>
            <div className="text-xs opacity-80">Online • Fast response</div>
          </div>
          {/* Clear Conversation button for client users */}
          {user && sessionId && (
            <button
              className="ml-auto flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition text-sm font-semibold"
              title="Clear Conversation"
              onClick={async () => {
                if (window.confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
                  await fetch(`${API_BASE}?delete_session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId })
                  });
                  setSessionId(null);
                  localStorage.removeItem('builditpc_chat_session_id');
                  setMessages([]);
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Clear Conversation
            </button>
          )}
        </div>
      )}
      {/* Quick Suggestions */}
      <div className="bg-green-50 px-6 py-3 flex flex-wrap gap-2 border-b">
        {recommendedQuestions.map((q, i) => (
          <button
            key={i}
            className="px-3 py-1 bg-white border border-green-200 rounded-full text-green-700 text-sm hover:bg-green-100 transition"
            onClick={() => setNewMessage(q)}
          >
            {q}
          </button>
        ))}
      </div>
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${customStyles.messagesArea || ''}`}>
        {messages.length === 0 && (
          <div className="text-gray-400 text-center">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-2xl px-4 py-2 max-w-xs shadow ${msg.sender === 'user' ? 'bg-green-200 text-right' : 'bg-white border border-green-200'}`}>
              <div className="text-sm">{msg.message}</div>
              <div className="text-xs text-gray-500 mt-1">{msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div className={`p-4 pb-6 px-4 border-t flex items-center gap-2 rounded-b-lg ${customStyles.inputArea || 'bg-white'}`}>
        <input
          type="text"
          className="flex-1 min-w-0 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Type your message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          disabled={loading}
        />
        <button
          className={(customStyles.sendButton || 'bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition') + ' min-w-[90px] justify-center'}
          onClick={sendMessage}
          disabled={loading}
        >
          <Send className="w-5 h-5" /> Send
        </button>
      </div>
      {error && <div className="text-red-500 p-2 text-center">{error}</div>}
    </div>
  );
};

export default ChatSupport; 