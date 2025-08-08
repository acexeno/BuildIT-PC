import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import ChatSupport from '../pages/ChatSupport';

const FloatingChatButton = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('builditpc_chat_session_id') || null;
  });

  // Check for unread messages
  useEffect(() => {
    if (!sessionId || !user) return;

    const checkUnreadMessages = async () => {
      try {
        const res = await fetch(`/backend/api/chat.php?unread_count&user_id=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unread_count);
        }
      } catch (error) {
        console.error('Error checking unread count:', error);
      }
    };

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [sessionId, user]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show for admin/employee users (they have their own chat interface)
  if (user && user.roles && (user.roles.includes('Admin') || user.roles.includes('Employee'))) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center relative"
          title="Chat Support"
        >
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">Chat Support</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMinimize}
                className="text-white hover:text-gray-200 transition-colors p-1"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200 transition-colors p-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden">
              <ChatSupport 
                user={user} 
                hideHeader={true}
                customStyles={{
                  messagesArea: 'p-4',
                  inputArea: 'bg-gray-50'
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChatButton; 