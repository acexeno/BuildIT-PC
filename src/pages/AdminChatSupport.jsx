import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, CheckCircle, Trash2, User, UserCheck, User2 } from 'lucide-react';

const API_BASE = '/backend/api/chat.php';

// Accept user prop for role/status coloring
const AdminChatSupport = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  // Helper for role badge color
  const getRoleBadge = (roles) => {
    if (!roles) return null;
    if (roles.includes('Admin')) return <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold ml-2">Admin</span>;
    if (roles.includes('Employee')) return <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold ml-2">Employee</span>;
    return null;
  };
  // Helper for status badge color
  const getStatusBadge = (isActive) => {
    return isActive
      ? <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold ml-2">Active</span>
      : <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold ml-2">Disabled</span>;
  };

  // Fetch all chat sessions
  useEffect(() => {
    setLoadingChats(true);
    fetch(`${API_BASE}?sessions`)
      .then(res => res.json())
      .then(data => {
        setChats(data.sessions || []);
        setLoadingChats(false);
        if (data.sessions && data.sessions.length > 0) {
          setSelectedChatId(data.sessions[0].id);
        }
      })
      .catch(() => {
        setError('Failed to load chat sessions.');
        setLoadingChats(false);
      });
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChatId) return;
    setLoadingMessages(true);
    fetch(`${API_BASE}?messages&session_id=${selectedChatId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setLoadingMessages(false);
      })
      .catch(() => {
        setError('Failed to load messages.');
        setLoadingMessages(false);
      });
  }, [selectedChatId]);

  const filteredChats = chats.filter(chat =>
    (chat.user_id ? String(chat.user_id) : (chat.guest_name || '')).toLowerCase().includes(search.toLowerCase()) ||
    (chat.guest_email || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedChat = chats.find(chat => String(chat.id) === String(selectedChatId));

  const handleSendReply = () => {
    if (!reply.trim() || !selectedChatId) return;
    fetch(`${API_BASE}?send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selectedChatId, sender: 'admin', message: reply })
    })
      .then(res => res.json())
      .then(() => {
        setReply('');
        // Refresh messages
        fetch(`${API_BASE}?messages&session_id=${selectedChatId}`)
          .then(res => res.json())
          .then(data => setMessages(data.messages || []));
      });
  };

  const handleMarkResolved = () => {
    if (!selectedChatId) return;
    fetch(`${API_BASE}?resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selectedChatId })
    })
      .then(res => res.json())
      .then(() => {
        // Refresh chats
        fetch(`${API_BASE}?sessions`)
          .then(res => res.json())
          .then(data => {
            setChats(data.sessions || []);
            // Keep the selected chat and reload its messages
            if (selectedChatId) {
              fetch(`${API_BASE}?messages&session_id=${selectedChatId}`)
                .then(res => res.json())
                .then(data => setMessages(data.messages || []));
            }
          });
      });
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    await fetch(`${API_BASE}?delete_message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId })
    });
    // Refresh messages
    fetch(`${API_BASE}?messages&session_id=${selectedChatId}`)
      .then(res => res.json())
      .then(data => setMessages(data.messages || []));
  };

  return (
    <div className="flex h-full w-full bg-gray-50">
      {/* Sidebar: Chat List */}
      <div className="w-1/3 min-w-[260px] max-w-xs border-r bg-white p-4 flex flex-col shadow-md">
        <div className="flex items-center mb-4">
          <Search className="w-4 h-4 mr-2 text-gray-400" />
          <input
            type="text"
            placeholder="Search user or email..."
            className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-1">
          {loadingChats ? (
            <div className="text-gray-400 text-sm">Loading chats...</div>
          ) : (
            filteredChats.map(chat => (
              <div
                key={chat.id}
                className={`p-3 rounded-xl cursor-pointer border flex items-center justify-between transition-all duration-200 ${selectedChatId === chat.id ? 'bg-green-100 border-green-500 shadow-lg' : 'hover:bg-gray-100 border-gray-200'}`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <div className="flex items-center gap-2">
                  <div className="font-semibold truncate max-w-[120px] flex items-center gap-1">
                    {!chat.user_id
                      ? (<><User2 className="inline w-4 h-4 text-gray-400" title="Guest" />{chat.guest_name || 'Guest'}</>)
                      : (<><UserCheck className="inline w-4 h-4 text-green-500" title="Registered User" />{chat.username || `User #${chat.user_id}`}</>)}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px]">{chat.guest_email || ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  {chat.status === 'resolved' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" title="Resolved" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-blue-500" title="Open" />
                  )}
                  <button
                    className="ml-1 text-red-400 hover:text-red-600 opacity-80 hover:opacity-100 transition-opacity"
                    title="Delete chat session"
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this chat session and all its messages?')) {
                        fetch(`${API_BASE}?delete_session`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ session_id: chat.id })
                        })
                          .then(res => res.json())
                          .then(() => {
                            fetch(`${API_BASE}?sessions`)
                              .then(res => res.json())
                              .then(data => {
                                setChats(data.sessions || []);
                                if (selectedChatId === chat.id) {
                                  setSelectedChatId(null);
                                }
                              });
                          });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
          {filteredChats.length === 0 && !loadingChats && <div className="text-gray-400 text-sm">No chats found.</div>}
        </div>
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {error && <div className="text-red-500 p-4">{error}</div>}
        {selectedChat ? (
          <div className="flex flex-col h-full">
            {/* Header Bar */}
            <div className="flex items-center justify-between bg-white px-8 py-5 border-b rounded-t-2xl shadow-md">
              <div>
                <div className="font-bold text-xl flex items-center gap-2">
                  {!selectedChat.user_id
                    ? (<><User2 className="inline w-5 h-5 text-gray-400" title="Guest" />{selectedChat.guest_name || 'Guest'}</>)
                    : (<><UserCheck className="inline w-5 h-5 text-green-500" title="Registered User" />{selectedChat.username || `User #${selectedChat.user_id}`}</>)}
                  {getRoleBadge(user?.roles || [])}
                  {getStatusBadge(user?.is_active)}
                </div>
                <div className="text-xs text-gray-500">{selectedChat.guest_email || ''}</div>
              </div>
              <div>
                {selectedChat.status === 'resolved' ? (
                  <span className="text-green-600 font-semibold flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Resolved</span>
                ) : (
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition"
                    onClick={handleMarkResolved}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Mark as Resolved
                  </button>
                )}
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-5 bg-gray-50 fade-in">
              {loadingMessages ? (
                <div className="text-gray-400 text-sm">Loading messages...</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg.id || idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} items-end relative`}>
                    <div className={`group relative rounded-2xl px-5 py-3 max-w-lg shadow-md ${msg.sender === 'admin' ? 'bg-green-200 text-right ml-12' : 'bg-white border mr-12'}`} style={{wordBreak: 'break-word'}}>
                      {/* Trash icon inside bubble, top-right, visible on hover */}
                      <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 z-10"
                        title="Delete message"
                        onClick={() => handleDeleteMessage(msg.id)}
                        style={{padding: 0, background: 'none', border: 'none'}}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-base font-medium text-gray-800 pr-6">{msg.message}</div>
                      <div className="text-xs text-gray-500 mt-2 text-right">{msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Input */}
            <div className="p-5 border-t bg-white flex items-center gap-3 rounded-b-2xl shadow-md" style={{marginBottom: 0}}>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-full px-5 py-3 mr-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-base bg-gray-50"
                placeholder="Type your reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
              />
              <button
                className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition text-base shadow"
                onClick={handleSendReply}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">Select a chat to view messages</div>
        )}
      </div>
    </div>
  );
};

export default AdminChatSupport; 