import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { FiBell, FiX, FiMessageCircle, FiHeart, FiUser } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'

const NotificationCenter = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user && socket) {
      // Listen for real-time notifications
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })

      socket.on('new-message', (data) => {
        const notification = {
          id: Date.now(),
          type: 'message',
          title: 'New Message',
          message: `${data.sender.username} sent you a message`,
          timestamp: new Date(),
          read: false,
          data: data
        }
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })

      socket.on('post-liked', (data) => {
        const notification = {
          id: Date.now(),
          type: 'like',
          title: 'Post Liked',
          message: `${data.user.username} liked your post`,
          timestamp: new Date(),
          read: false,
          data: data
        }
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })

      socket.on('new-comment', (data) => {
        const notification = {
          id: Date.now(),
          type: 'comment',
          title: 'New Comment',
          message: `${data.user.username} commented on your post`,
          timestamp: new Date(),
          read: false,
          data: data
        }
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })

      return () => {
        socket.off('notification')
        socket.off('new-message')
        socket.off('post-liked')
        socket.off('new-comment')
      }
    }
  }, [user, socket])

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <FiMessageCircle className="text-blue-500" size={16} />
      case 'like':
        return <FiHeart className="text-red-500" size={16} />
      case 'comment':
        return <FiMessageCircle className="text-green-500" size={16} />
      case 'follow':
        return <FiUser className="text-purple-500" size={16} />
      default:
        return <FiBell className="text-gray-500" size={16} />
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FiBell size={32} className="mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationCenter




