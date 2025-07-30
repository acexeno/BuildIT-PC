import React, { createContext, useContext, useState, useEffect } from 'react'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children, user }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load notifications when user changes
  useEffect(() => {
    if (user && user.id) {
      loadNotifications()
      loadUnreadCount()
      // Poll unread count every 5 seconds
      const interval = setInterval(() => {
        loadUnreadCount()
      }, 5000)
      return () => clearInterval(interval)
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user || !user.id) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/backend/api/index.php?endpoint=notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Convert timestamp strings to Date objects
          const notificationsWithDates = data.data.map(notification => ({
            ...notification,
            timestamp: new Date(notification.timestamp)
          }))
          setNotifications(notificationsWithDates)
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    if (!user || !user.id) return
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/backend/api/index.php?endpoint=notifications&count=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.count)
        }
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    if (!user || !user.id) return
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/backend/api/index.php?endpoint=notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_id: notificationId })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === notificationId 
                ? { ...notification, read: true }
                : notification
            )
          )
          // Update unread count
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user || !user.id) return
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/backend/api/index.php?endpoint=notifications&action=mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(prev => 
            prev.map(notification => ({ ...notification, read: true }))
          )
          setUnreadCount(0)
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    if (!user || !user.id) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/backend/api/index.php?endpoint=notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notification_id: notificationId })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const notification = notifications.find(n => n.id === notificationId)
          setNotifications(prev => 
            prev.filter(notification => notification.id !== notificationId)
          )
          // Update unread count if the deleted notification was unread
          if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
          // Immediately sync with backend
          loadUnreadCount()
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const deleteAllNotifications = async () => {
    if (!user || !user.id) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('/backend/api/index.php?endpoint=notifications&all=1', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    loadNotifications,
    loadUnreadCount,
    deleteAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
} 