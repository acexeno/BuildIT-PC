import React, { useState } from 'react';
import { BarChart3, Package, TrendingUp, FileText, Cpu, Monitor, Bell, MessageSquare, Menu, X, Lock } from 'lucide-react';

const EmployeeSidebar = ({ currentPage, onPageChange, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // handle user logout with confirmation
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  // get the user's role display text
  const getUserRoleDisplay = () => {
    if (!user?.roles) return 'User';
    return user.roles.join(', ');
  };

  // pick the right color based on user role
  const getRoleColor = () => {
    if (!user?.roles) return 'bg-gray-500';
    if (user.roles.includes('Super Admin')) return 'bg-red-500';
    if (user.roles.includes('Admin')) return 'bg-purple-500';
    if (user.roles.includes('Employee')) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const navTabs = [
    { id: 'employee-dashboard', name: 'Dashboard', icon: <BarChart3 className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'sales-reports', name: 'Sales Reports', icon: <TrendingUp className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'system-reports', name: 'System Reports', icon: <FileText className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'inventory', name: 'Inventory', icon: <Package className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'orders-management', name: 'Orders Management', icon: <FileText className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'pc-assembly', name: 'PC Assembly', icon: <Cpu className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'prebuilt-management', name: 'Prebuilt Management', icon: <Monitor className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
    { id: 'admin-chat-support', name: 'Chat Support', icon: <MessageSquare className="mr-3 h-4 w-4 lg:h-5 lg:w-5" /> },
  ];

  // Get all tabs but mark disabled ones
  const allTabs = navTabs.map(tab => {
    let isDisabled = false;
    if (tab.id === 'inventory') {
      isDisabled = Number(user?.can_access_inventory) !== 1;
    } else if (tab.id === 'orders-management') {
      isDisabled = Number(user?.can_access_orders) !== 1;
    } else if (tab.id === 'admin-chat-support') {
      isDisabled = Number(user?.can_access_chat_support) !== 1;
    }
    return { ...tab, isDisabled };
  });

  // Handle navigation with permission checks
  const handleNavigation = (tabId, isDisabled) => {
    if (isDisabled) {
      let message = '';
      if (tabId === 'inventory') {
        message = 'Your access to Inventory Management has been disabled by a Super Admin.';
      } else if (tabId === 'orders-management') {
        message = 'Your access to Orders Management has been disabled by a Super Admin.';
      } else if (tabId === 'admin-chat-support') {
        message = 'Your access to Chat Support has been disabled by a Super Admin.';
      }
      alert(message);
      return;
    }
    
    // If permission check passes, navigate
    onPageChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-md shadow-lg border"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40 top-0
        w-72 xl:w-80 bg-white shadow-lg flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* header with logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">SIMS</h1>
              <p className="text-xs lg:text-sm text-gray-500">PC Building Platform</p>
            </div>
          </div>
        </div>

        {/* user profile section */}
        {user && (
          <div className="p-3 lg:p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {user?.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt="Profile" 
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-4 h-4 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${getRoleColor()}`}>
                    {getUserRoleDisplay()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* navigation menu */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
          <div className="pt-2 lg:pt-4 border-t border-gray-200">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Employee
            </h3>
          </div>
          {allTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNavigation(tab.id, tab.isDisabled)}
              disabled={tab.isDisabled}
              className={`w-full flex items-center px-3 lg:px-5 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors truncate ${
                tab.isDisabled
                  ? 'text-gray-400 cursor-not-allowed opacity-60 bg-gray-50 border border-gray-200'
                  : currentPage === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={tab.isDisabled ? 'Access disabled by Super Admin' : ''}
            >
              {tab.icon}
              <span className="flex-1 text-left">{tab.name}</span>
              {tab.isDisabled && (
                <Lock className="ml-2 h-4 w-4 text-gray-400" />
              )}
            </button>
          ))}
        </nav>

        {/* logout button */}
        <div className="p-3 lg:p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 lg:px-5 py-2 text-xs lg:text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
          >
            <svg className="mr-3 h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default EmployeeSidebar; 