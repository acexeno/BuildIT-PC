import React, { useState, useEffect } from 'react'
import NotificationToast from './NotificationToast'
import { useNotifications } from '../contexts/NotificationContext'

const NotificationManager = () => {
  const [activeToasts, setActiveToasts] = useState([])
  const { notifications, markAsRead } = useNotifications()

  useEffect(() => {
    // Check for new unread notifications and show them as toasts
    const newNotifications = notifications.filter(n => !n.read && !activeToasts.find(toast => toast.id === n.id))
    
    if (newNotifications.length > 0) {
      // Only show the most recent notification as a toast
      const latestNotification = newNotifications[0]
      setActiveToasts(prev => [...prev, latestNotification])
    }
  }, [notifications, activeToasts])

  const handleCloseToast = (notificationId) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== notificationId))
  }

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId)
    handleCloseToast(notificationId)
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {activeToasts.map((notification, index) => (
        <div
          key={notification.id}
          style={{ transform: `translateY(${index * 80}px)` }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => handleCloseToast(notification.id)}
            onMarkAsRead={() => handleMarkAsRead(notification.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default NotificationManager 