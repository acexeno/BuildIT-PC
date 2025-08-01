import React, { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import AdminSidebar from './components/AdminSidebar'
import EmployeeSidebar from './components/EmployeeSidebar'
import TopNavigation from './components/TopNavigation'
import Home from './pages/Home'
import PCAssembly from './pages/PCAssembly'
import ChatSupport from './pages/ChatSupport'
import MyBuilds from './pages/MyBuilds'
import MyOrders from './pages/MyOrders'
import PrebuiltPCs from './pages/PrebuiltPCs'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import { NotificationProvider } from './contexts/NotificationContext'
import NotificationManager from './components/NotificationManager'
import AdminChatSupport from './pages/AdminChatSupport';
import FloatingChatButton from './components/FloatingChatButton';
import './App.css'

// these are the pages that need login to access
const PROTECTED_PAGES = ['my-builds', 'my-orders', 'notifications']

// check if the JWT token has expired
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

const token = localStorage.getItem('token');
if (token && isTokenExpired(token)) {
  localStorage.removeItem('token');
}

const AppContent = () => {
  // figure out which page to show first based on user role (admins and employees go to their dashboards)
  const getInitialPage = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles = payload.roles || [];
        if (typeof roles === 'string' && roles.includes('Super Admin')) return 'super-admin-dashboard';
        if (Array.isArray(roles) && roles.includes('Super Admin')) return 'super-admin-dashboard';
        if (typeof roles === 'string' && roles.includes('Admin')) return 'admin-dashboard';
        if (Array.isArray(roles) && roles.includes('Admin')) return 'admin-dashboard';
        if (typeof roles === 'string' && roles.includes('Employee')) return 'employee-dashboard';
        if (Array.isArray(roles) && roles.includes('Employee')) return 'employee-dashboard';
      } catch {}
    }
    return 'home';
  };
  const [currentPage, setCurrentPage] = useState(getInitialPage());
  const [selectedComponents, _setSelectedComponents] = useState({})
  const [prebuiltComponentIds, setPrebuiltComponentIds] = useState(null)
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(null) // null, 'login', 'register'
  const [isLoading, setIsLoading] = useState(true)
  const [superAdminTab, setSuperAdminTab] = useState('dashboard');

  const setSelectedComponents = useCallback((value) => {
    _setSelectedComponents(value)
  }, [])

  // check if the user's token is still valid when the app starts
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token')
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('token');
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/backend/api/index.php?endpoint=verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // grab the full user profile to restore everything
            const profileResponse = await fetch('/backend/api/index.php?endpoint=profile', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              if (profileData.success) {
                setUser(profileData.user)
              } else {
                setUser(null)
                localStorage.removeItem('token')
              }
            } else if (profileResponse.status === 401) {
              // Unauthorized, remove token and do not log error
              setUser(null)
              localStorage.removeItem('token')
            }
          } else {
            setUser(null)
            localStorage.removeItem('token')
          }
        } else if (response.status === 401) {
          setUser(null)
          localStorage.removeItem('token')
        }
      } catch (error) {
        // ignore 401 errors, only log the other ones
        if (!(error && error.status === 401)) {
          // we could log other errors here if needed
          // console.error('Error verifying token:', error)
        }
        setUser(null)
        localStorage.removeItem('token')
      } finally {
        setIsLoading(false)
      }
    }

    verifyToken()
  }, [])

  // handle when user clicks on navigation items
  const handlePageChange = (page) => {
    // If non-user tries to access protected page, show login in main area
    if (!user && PROTECTED_PAGES.includes(page)) {
      setCurrentPage(page)
      setShowAuth('login')
    } else if (page === 'login' || page === 'register') {
      setCurrentPage(page)
      setShowAuth(page)
    } else if (page === 'admin-dashboard' && user?.roles?.includes('Admin')) {
      setCurrentPage('admin-dashboard');
      setShowAuth(null);
    } else if (page === 'employee-dashboard' && user?.roles?.includes('Employee')) {
      setCurrentPage('employee-dashboard');
      setShowAuth(null);
    } else {
      setCurrentPage(page)
      setShowAuth(null)
    }
  }

  // handle user logout
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token'); // Remove JWT token on logout
    localStorage.removeItem('user');
    localStorage.removeItem('builditpc_chat_session_id');
    localStorage.removeItem('builditpc_guest_name');
    localStorage.removeItem('builditpc_guest_email');
    setCurrentPage('home')
    setShowAuth(null)
    window.location.reload(); // Force reload to reset app state
  }

  // handle when user picks a prebuilt PC
  const handlePrebuiltSelect = (componentIds) => {
    setPrebuiltComponentIds(componentIds)
    setCurrentPage('pc-assembly')
  }

  // clear the prebuilt selection after the PC assembly page loads
  const handlePCAssemblyLoaded = () => {
    if (prebuiltComponentIds) setPrebuiltComponentIds(null)
  }

  // handle super admin tab switching
  const handleSuperAdminTabChange = (tab) => {
    setCurrentPage('super-admin-dashboard');
    setSuperAdminTab(tab);
  };

  // show a loading spinner while we check the token
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // figure out which dashboard the user should see based on their role
  const getUserDashboard = () => {
    if (!user?.roles) return null
    
    if (user.roles.includes('Super Admin')) {
      return 'super-admin-dashboard'
    } else if (user.roles.includes('Admin')) {
      return 'admin-dashboard'
    } else if (user.roles.includes('Employee')) {
      return 'employee-dashboard'
    }
    return null
  }

  // the main app layout
  return (
    <>
      <NotificationProvider user={user}>
        {/* layout with conditional top navigation */}
        <div className="min-h-screen bg-gray-50">
          {/* only show top navigation for non-admin users (clients and guests) */}
          {(!user?.roles || user?.roles?.includes('Client') || !user?.roles?.some(role => ['Super Admin', 'Admin', 'Employee'].includes(role))) && (
            <TopNavigation
              currentPage={currentPage}
              onPageChange={handlePageChange}
              user={user}
              onLogout={handleLogout}
              onSuperAdminTabChange={handleSuperAdminTabChange}
              activeSuperAdminTab={currentPage === 'super-admin-dashboard' ? superAdminTab : undefined}
            />
          )}
          
          {/* show sidebars for admin users */}
          {(user?.roles?.includes('Super Admin') || user?.roles?.includes('Admin') || user?.roles?.includes('Employee')) ? (
            <div className="flex">
              {/* sidebar for admin users */}
              {(user?.roles?.includes('Super Admin') || user?.roles?.includes('Admin')) && (
                <AdminSidebar
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  user={user}
                  onLogout={handleLogout}
                  onSuperAdminTabChange={handleSuperAdminTabChange}
                  activeSuperAdminTab={currentPage === 'super-admin-dashboard' ? superAdminTab : undefined}
                />
              )}
              
                               {/* sidebar for employee users */}
                 {user?.roles?.includes('Employee') && !user?.roles?.includes('Admin') && !user?.roles?.includes('Super Admin') && (
                   <EmployeeSidebar
                     currentPage={currentPage}
                     onPageChange={(page) => {
                       // for employee users, we need to handle both page changes and internal tab changes
                       if (page === 'employee-dashboard' || ['inventory', 'orders-management', 'notifications', 'sales-reports', 'system-reports', 'pc-assembly', 'prebuilt-management'].includes(page)) {
                         handlePageChange(page);
                       }
                     }}
                     user={user}
                     onLogout={handleLogout}
                   />
                 )}
              
              {/* main content area with sidebar */}
              <main className="flex-1 bg-gray-50">
                {/* show login/register forms in the main area when needed */}
                {showAuth === 'login' && (
              <Login onLogin={async (u) => {
                // clean up any guest chat data when user logs in
                localStorage.removeItem('builditpc_chat_session_id');
                localStorage.removeItem('builditpc_guest_name');
                setUser(u);
                // grab the user's chat session if they have one
                if (u && u.id) {
                  try {
                    const res = await fetch('/backend/api/chat.php?sessions');
                    const data = await res.json();
                    if (data.sessions && Array.isArray(data.sessions)) {
                      const userSession = data.sessions.find(s => String(s.user_id) === String(u.id));
                      if (userSession) {
                        localStorage.setItem('builditpc_chat_session_id', userSession.id);
                      }
                    }
                  } catch (e) { /* fail silently */ }
                }
                setShowAuth(null);
                // figure out which dashboard to show based on user role
                if (u?.roles?.includes('Super Admin')) {
                  setCurrentPage('super-admin-dashboard');
                } else if (u?.roles?.includes('Admin')) {
                  setCurrentPage('admin-dashboard');
                } else if (u?.roles?.includes('Employee')) {
                  setCurrentPage('employee-dashboard');
                } else {
                  setCurrentPage('home');
                }
              }} onSwitchToRegister={() => { setShowAuth('register'); setCurrentPage('register'); }} />
            )}
            {showAuth === 'register' && (
              <Register onRegister={() => { setShowAuth('login'); setCurrentPage('login'); }} onSwitchToLogin={() => { setShowAuth('login'); setCurrentPage('login'); }} />
            )}
            {/* main content area - only show when not logging in/registering */}
            {!showAuth && (
              <>
                {/* show different dashboards based on user role */}
                {currentPage === 'super-admin-dashboard' && user?.roles?.includes('Super Admin') && (
                  <SuperAdminDashboard initialTab={superAdminTab} user={user} />
                )}
                {currentPage === 'admin-dashboard' && user?.roles?.includes('Admin') && (
                  <AdminDashboard user={user} />
                )}
                {currentPage === 'prebuilt-management' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="prebuilt-management" user={user} />
                )}
                {currentPage === 'pc-assembly' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="pc-assembly" />
                )}
                {currentPage === 'sales-reports' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="sales-reports" user={user} />
                )}
                {currentPage === 'system-reports' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="system-reports" user={user} />
                )}
                {currentPage === 'notifications' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="notifications" user={user} />
                )}
                {currentPage === 'inventory' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="inventory" user={user} />
                )}
                {currentPage === 'orders-management' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="orders" user={user} />
                )}
                                                 {currentPage === 'employee-dashboard' && user?.roles?.includes('Employee') && (
                  <EmployeeDashboard user={user} setUser={setUser} initialTab="employee-dashboard" />
                )}
                {currentPage === 'sales-reports' && user?.roles?.includes('Employee') && (
                  <EmployeeDashboard initialTab="sales-reports" user={user} setUser={setUser} />
                )}
                {currentPage === 'system-reports' && user?.roles?.includes('Employee') && (
                  <EmployeeDashboard initialTab="system-reports" user={user} setUser={setUser} />
                )}
                {currentPage === 'prebuilt-management' && user?.roles?.includes('Employee') && (
                  <EmployeeDashboard initialTab="prebuilt-management" user={user} setUser={setUser} />
                )}
                {currentPage === 'pc-assembly' && user?.roles?.includes('Employee') && (
                  <EmployeeDashboard initialTab="pc-assembly" user={user} setUser={setUser} />
                )}
                {currentPage === 'notifications' && user?.roles?.includes('Employee') && (
                  <EmployeeDashboard initialTab="notifications" user={user} setUser={setUser} />
                )}
                
                {/* regular customer pages */}
                {currentPage === 'home' && <Home setCurrentPage={setCurrentPage} setSelectedComponents={setSelectedComponents} />}
                {currentPage === 'prebuilt-pcs' && (
                  <PrebuiltPCs user={user} setCurrentPage={setCurrentPage} setSelectedComponents={setSelectedComponents} />
                )}
                {currentPage === 'pc-assembly' && user?.roles?.includes('Super Admin') && (
                  <SuperAdminDashboard initialTab="pc-assembly" />
                )}
                {currentPage === 'pc-assembly' && user?.roles?.includes('Admin') && (
                  <AdminDashboard initialTab="pc-assembly" />
                )}
                {currentPage === 'pc-assembly' && (!user?.roles || (!user.roles.includes('Super Admin') && !user.roles.includes('Admin'))) && (
                  <PCAssembly 
                    setCurrentPage={setCurrentPage}
                    setSelectedComponents={setSelectedComponents} 
                    selectedComponents={prebuiltComponentIds || selectedComponents} 
                    onLoaded={handlePCAssemblyLoaded}
                    user={user}
                    setUser={setUser}
                    onShowAuth={(authType) => {
                      setShowAuth(authType)
                      setCurrentPage(authType)
                    }}
                  />
                )}
                {currentPage === 'chat-support' && <ChatSupport user={user} setCurrentPage={setCurrentPage} />}
                {currentPage === 'my-builds' && user && <MyBuilds setCurrentPage={setCurrentPage} setSelectedComponents={setSelectedComponents} />}
                {currentPage === 'my-orders' && user && <MyOrders setCurrentPage={setCurrentPage} />}
                {currentPage === 'notifications' && user && <Notifications user={user} />}
                {currentPage === 'admin-chat-support' && user?.roles?.includes('Admin') && (
                  <AdminChatSupport user={user} />
                )}
                
                {/* admin/employee management pages */}
                {['inventory', 'orders-management', 'reports'].includes(currentPage) && user?.roles?.includes('Super Admin') && (
                  <SuperAdminDashboard initialTab={currentPage} user={user} />
                )}
                {['inventory', 'orders-management'].includes(currentPage) && user?.roles?.includes('Employee') && (
                  <EmployeeDashboard initialTab={currentPage} user={user} setUser={setUser} />
                )}

                {/* super admin only pages */}
                {['user-management', 'system-settings', 'system-reports', 'prebuilt-management'].includes(currentPage) && user?.roles?.includes('Super Admin') && (
                  <SuperAdminDashboard initialTab={currentPage} user={user} />
                )}

                {/* super admin and admin prebuilt management */}
              </>
            )}
              </main>
            </div>
          ) : (
            /* main content area for non-admin users (no sidebar) */
            <main className="bg-gray-50">
              {/* show login/register forms in the main area when needed */}
              {showAuth === 'login' && (
                <Login onLogin={async (u) => {
                  // clean up any guest chat data when user logs in
                  localStorage.removeItem('builditpc_chat_session_id');
                  localStorage.removeItem('builditpc_guest_name');
                  setUser(u);
                  // grab the user's chat session if they have one
                  if (u && u.id) {
                    try {
                      const res = await fetch('/backend/api/chat.php?sessions');
                      const data = await res.json();
                      if (data.sessions && Array.isArray(data.sessions)) {
                        const userSession = data.sessions.find(s => String(s.user_id) === String(u.id));
                        if (userSession) {
                          localStorage.setItem('builditpc_chat_session_id', userSession.id);
                        }
                      }
                    } catch (e) { /* fail silently */ }
                  }
                  setShowAuth(null);
                  // figure out which dashboard to show based on user role
                  if (u?.roles?.includes('Super Admin')) {
                    setCurrentPage('super-admin-dashboard');
                  } else if (u?.roles?.includes('Admin')) {
                    setCurrentPage('admin-dashboard');
                  } else if (u?.roles?.includes('Employee')) {
                    setCurrentPage('employee-dashboard');
                  } else {
                    setCurrentPage('home');
                  }
                }} onSwitchToRegister={() => { setShowAuth('register'); setCurrentPage('register'); }} />
              )}
              {showAuth === 'register' && (
                <Register onRegister={() => { setShowAuth('login'); setCurrentPage('login'); }} onSwitchToLogin={() => { setShowAuth('login'); setCurrentPage('login'); }} />
              )}
              {/* main content area - only show when not logging in/registering */}
              {!showAuth && (
                <>
                  {/* regular customer pages */}
                  {currentPage === 'home' && <Home setCurrentPage={setCurrentPage} setSelectedComponents={setSelectedComponents} />}
                  {currentPage === 'prebuilt-pcs' && (
                    <PrebuiltPCs user={user} setCurrentPage={setCurrentPage} setSelectedComponents={setSelectedComponents} />
                  )}
                  {currentPage === 'pc-assembly' && (!user?.roles || (!user.roles.includes('Super Admin') && !user.roles.includes('Admin'))) && (
                    <PCAssembly 
                      setCurrentPage={setCurrentPage}
                      setSelectedComponents={setSelectedComponents} 
                      selectedComponents={prebuiltComponentIds || selectedComponents} 
                      onLoaded={handlePCAssemblyLoaded}
                      user={user}
                      setUser={setUser}
                      onShowAuth={(authType) => {
                        setShowAuth(authType)
                        setCurrentPage(authType)
                      }}
                    />
                  )}
                  {currentPage === 'chat-support' && <ChatSupport user={user} setCurrentPage={setCurrentPage} />}
                  {currentPage === 'my-builds' && user && <MyBuilds setCurrentPage={setCurrentPage} setSelectedComponents={setSelectedComponents} />}
                  {currentPage === 'my-orders' && user && <MyOrders setCurrentPage={setCurrentPage} />}
                  {currentPage === 'notifications' && user && <Notifications user={user} />}
                </>
              )}
            </main>
          )}
        </div>
        {/* notification popups - only for logged in users */}
        {/* {user && <NotificationManager />} */}
      </NotificationProvider>
      {/* floating chat button (super admins don't see this) */}
      <FloatingChatButton user={user} setCurrentPage={setCurrentPage} />
    </>
  )
}

function App() {
  return <AppContent />
}

export default App 