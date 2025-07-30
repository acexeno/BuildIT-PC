import React from 'react';
import { Settings, Monitor, Bell, Cpu, BarChart3, Users, Package, Wrench, FileText, TrendingUp, MessageSquare } from 'lucide-react';

const AdminSidebar = ({ currentPage, onPageChange, user, onLogout, onSuperAdminTabChange, activeSuperAdminTab, notificationsCount }) => {
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

  return (
    <div className="w-72 xl:w-80 bg-white shadow-lg flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {/* header with logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">BUILD IT:PC</h1>
            <p className="text-sm text-gray-500">PC Building Platform</p>
          </div>
        </div>
      </div>

      {/* user profile section */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              {user?.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
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
      <nav className="flex-1 p-4 space-y-2">
        {/* super admin menu items */}
        {user?.roles?.includes('Super Admin') && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Super Admin
              </h3>
            </div>
            {[
              { id: 'dashboard', name: 'Dashboard', icon: <BarChart3 className="mr-3 h-5 w-5" /> },
              { id: 'notifications', name: 'Notifications', icon: <Bell className="mr-3 h-5 w-5" /> },
              { id: 'reports', name: 'Sales Reports', icon: <TrendingUp className="mr-3 h-5 w-5" /> },
              { id: 'system-reports', name: 'System Reports', icon: <FileText className="mr-3 h-5 w-5" /> },
              { id: 'inventory', name: 'Inventory', icon: <Package className="mr-3 h-5 w-5" /> },
              { id: 'orders-management', name: 'Orders', icon: <Wrench className="mr-3 h-5 w-5" /> },
              { id: 'pc-assembly', name: 'PC Assembly', icon: <Cpu className="mr-3 h-5 w-5" /> },
              { id: 'prebuilt-management', name: 'Prebuilt Management', icon: <Monitor className="mr-3 h-5 w-5" /> },
              { id: 'user-management', name: 'User Management', icon: <Users className="mr-3 h-5 w-5" /> },
              { id: 'system-settings', name: 'Settings', icon: <Settings className="mr-3 h-5 w-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onSuperAdminTabChange(tab.id)}
                className={`w-full flex items-center px-5 py-2 text-sm font-medium rounded-md transition-colors truncate ${
                  currentPage === 'super-admin-dashboard' && activeSuperAdminTab === tab.id
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.name}
                {tab.id === 'notifications' && (typeof notificationsCount !== 'undefined' && notificationsCount > 0) && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {notificationsCount}
                  </span>
                )}
              </button>
            ))}
          </>
        )}

        {user?.roles?.includes('Admin') && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </h3>
            </div>
            {[
              { id: 'admin-dashboard', name: 'Dashboard', icon: <BarChart3 className="mr-3 h-5 w-5" /> },
              { id: 'notifications', name: 'Notifications', icon: <Bell className="mr-3 h-5 w-5" /> },
              { id: 'sales-reports', name: 'Sales Reports', icon: <TrendingUp className="mr-3 h-5 w-5" /> },
              { id: 'system-reports', name: 'System Reports', icon: <FileText className="mr-3 h-5 w-5" /> },
              { id: 'inventory', name: 'Inventory', icon: <Package className="mr-3 h-5 w-5" /> },
              { id: 'orders-management', name: 'Orders Management', icon: <FileText className="mr-3 h-5 w-5" /> },
              { id: 'pc-assembly', name: 'PC Assembly', icon: <Cpu className="mr-3 h-5 w-5" /> },
              { id: 'prebuilt-management', name: 'Prebuilt Management', icon: <Monitor className="mr-3 h-5 w-5" /> },
              // { id: 'admin-chat-support', name: 'Chat Support', icon: <MessageSquare className="mr-3 h-5 w-5" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onPageChange(tab.id)}
                className={`w-full flex items-center px-5 py-2 text-sm font-medium rounded-md transition-colors truncate ${
                  currentPage === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.name}
                {tab.id === 'notifications' && (typeof notificationsCount !== 'undefined' && notificationsCount > 0) && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {notificationsCount}
                  </span>
                )}
              </button>
            ))}
          </>
        )}

        {user?.roles?.includes('Employee') && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Employee
              </h3>
            </div>
            {[
              { id: 'employee-dashboard', name: 'Dashboard', icon: <BarChart3 className="mr-3 h-5 w-5" /> },
              { id: 'notifications', name: 'Notifications', icon: <Bell className="mr-3 h-5 w-5" /> },
              { id: 'sales-reports', name: 'Sales Reports', icon: <TrendingUp className="mr-3 h-5 w-5" /> },
              { id: 'system-reports', name: 'System Reports', icon: <FileText className="mr-3 h-5 w-5" /> },
              { id: 'inventory', name: 'Inventory', icon: <Package className="mr-3 h-5 w-5" /> },
              { id: 'orders-management', name: 'Orders Management', icon: <FileText className="mr-3 h-5 w-5" /> },
              { id: 'pc-assembly', name: 'PC Assembly', icon: <Cpu className="mr-3 h-5 w-5" /> },
              { id: 'prebuilt-management', name: 'Prebuilt Management', icon: <Monitor className="mr-3 h-5 w-5" /> },
              // { id: 'chat-support', name: 'Chat Support', icon: <MessageSquare className="mr-3 h-5 w-5" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onPageChange(tab.id)}
                className={`w-full flex items-center px-5 py-2 text-sm font-medium rounded-md transition-colors truncate ${
                  currentPage === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.name}
                {tab.id === 'notifications' && (typeof notificationsCount !== 'undefined' && notificationsCount > 0) && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {notificationsCount}
                  </span>
                )}
              </button>
            ))}
          </>
        )}

        {/* management section for employees */}
        {(user?.roles?.includes('Employee') && !user?.roles?.includes('Admin')) && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Management
              </h3>
            </div>
            <button
              onClick={() => onPageChange('inventory')}
              className={`w-full flex items-center px-5 py-2 text-sm font-medium rounded-md transition-colors truncate ${
                currentPage === 'inventory'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Package className="mr-3 h-5 w-5" />
              Inventory
            </button>
            <button
              onClick={() => onPageChange('orders-management')}
              className={`w-full flex items-center px-5 py-2 text-sm font-medium rounded-md transition-colors truncate ${
                currentPage === 'orders-management'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="mr-3 h-5 w-5" />
              Orders Management
            </button>
          </>
        )}
      </nav>

      {/* footer with logout button */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar; 