import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import ChatSupport from '../pages/ChatSupport';

const FloatingChatButton = ({ user, setCurrentPage }) => {
  // Hide for Super Admins
  if (user?.roles?.includes('Super Admin')) return null;

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-green-600 shadow-xl flex items-center justify-center hover:bg-green-700 transition-colors focus:outline-none"
          onClick={() => setOpen(true)}
          aria-label="Open chat support"
        >
          <MessageSquare className="w-8 h-8 text-white" />
        </button>
      )}
      {/* Animated Chat Widget */}
      <div
        className={`fixed z-50 right-6 bottom-6 sm:bottom-24 w-[350px] max-w-full sm:w-[350px] h-[500px] bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col transition-all duration-300 ease-in-out
          ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}
          sm:right-6 sm:bottom-24
        `}
        style={{ boxShadow: '0 8px 32px 0 rgba(60, 72, 88, 0.18)' }}
      >
        {/* Header */}
        <div className="relative flex items-center gap-4 bg-green-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full mr-2">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">BUILD IT:PC Support</div>
            <div className="text-xs opacity-80">Online • Fast response</div>
          </div>
          <button
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition focus:outline-none"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        {/* Divider */}
        <div className="h-[1.5px] bg-green-100 w-full" />
        {/* Chat Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatSupport user={user} setCurrentPage={setCurrentPage} customStyles={{
            messagesArea: 'scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-green-50',
            inputArea: 'bg-gray-50',
            sendButton: 'bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-2 font-semibold flex items-center gap-2 transition',
          }} hideHeader={true} />
        </div>
      </div>
      {/* Responsive full-width on mobile */}
      <style>{`
        @media (max-width: 640px) {
          .floating-chat-widget {
            width: 100vw !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: 0.75rem 0.75rem 0 0 !important;
            height: 70vh !important;
            min-height: 350px !important;
          }
        }
      `}</style>
    </>
  );
};

export default FloatingChatButton; 