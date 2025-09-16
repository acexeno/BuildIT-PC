import React from 'react';
import ChatScrollTest from '../components/ChatScrollTest';

const ScrollTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Chat Scroll Bar Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Component */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Scroll Test Component</h2>
            <div className="h-96">
              <ChatScrollTest />
            </div>
          </div>
          
          {/* Manual Test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Manual Scroll Test</h2>
            <div 
              className="h-96 overflow-y-scroll chat-messages-container border border-gray-200 rounded-lg p-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#9ca3af #f1f5f9'
              }}
            >
              {Array.from({ length: 50 }, (_, i) => (
                <div key={i} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-800">Message {i + 1}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    This is a test message to verify scroll bar functionality. 
                    This message is long enough to wrap to multiple lines and 
                    create enough content to make the scroll bar appear.
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(Date.now() - i * 60000).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Scroll Bar Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Scroll bar should be visible on the right side</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Scroll bar should be gray with rounded corners</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>You should be able to scroll up and down</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Auto-scroll should work when new messages arrive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollTestPage;
