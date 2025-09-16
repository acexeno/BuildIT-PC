import React, { useState, useEffect } from 'react';
import { MessageSquare, Shield, Users, AlertTriangle } from 'lucide-react';
import ChatSupport from '../pages/ChatSupport';
import AdminChatSupport from '../pages/AdminChatSupport';
import { API_BASE } from '../utils/apiBase';

const DynamicChatAccess = ({ user, fullScreen = false, customStyles = {}, hideHeader = false }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        // Check chat permissions
        const permRes = await fetch(`${API_BASE}/chat.php?check_permissions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const permData = await permRes.json();
        
        if (permData.success) {
          setPermissions(permData);
        }
        
      } catch (err) {
        console.error('Error checking permissions:', err);
        setError('Failed to load chat support');
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 animate-pulse text-green-600 mx-auto mb-2" />
          <div className="text-gray-600">Loading chat support...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  // Determine chat interface based on user role and permissions
  const getChatInterface = () => {
    // Admin/Employee interface - can view and manage all chats
    if (permissions?.canRead && (user?.roles?.includes('Admin') || user?.roles?.includes('Employee') || user?.roles?.includes('Super Admin'))) {
      return (
        <div className={fullScreen ? 'h-screen' : 'h-full'}>
          <AdminChatSupport user={user} />
        </div>
      );
    }
    
    // Regular user interface - can create and view their own chats
    return (
      <div className={fullScreen ? 'h-screen' : 'h-full'}>
        <ChatSupport 
          user={user} 
          customStyles={customStyles}
          hideHeader={hideHeader}
        />
      </div>
    );
  };

  // Show access denied for users without permissions
  if (permissions && !permissions.hasPermission && user && (user.roles?.includes('Admin') || user.roles?.includes('Employee'))) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access chat support management.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {getChatInterface()}
    </div>
  );
};

export default DynamicChatAccess;
