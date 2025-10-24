import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import UserSearch from '../components/UserSearch'
import { FiPlus, FiMessageCircle, FiUser, FiSearch } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'

const Chat = () => {
  const { user } = useAuth()
  const { socket, joinRoom, sendMessage, sendTyping } = useSocket()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('/api/chat/conversations')
        setConversations(response.data.conversations)
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`/api/chat/messages/${selectedConversation.otherUser._id}`)
          setMessages(response.data.messages)
          
          // Join the room for real-time updates
          joinRoom(selectedConversation.roomId)
        } catch (error) {
          console.error('Failed to fetch messages:', error)
        }
      }

      fetchMessages()
    }
  }, [selectedConversation, joinRoom])

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('receive-message', (message) => {
        setMessages(prev => [...prev, message])
      })

      socket.on('user-typing', (data) => {
        if (data.userId !== user._id) {
          setTypingUsers(prev => {
            if (data.isTyping) {
              return [...prev.filter(u => u.userId !== data.userId), data]
            } else {
              return prev.filter(u => u.userId !== data.userId)
            }
          })
        }
      })

      socket.on('message-error', (error) => {
        toast.error(error.error)
        setIsSending(false)
      })

      return () => {
        socket.off('receive-message')
        socket.off('user-typing')
        socket.off('message-error')
      }
    }
  }, [socket, user])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      // Send via Socket.io for real-time delivery
      sendMessage({
        senderId: user._id,
        receiverId: selectedConversation.otherUser._id,
        text: newMessage,
        roomId: selectedConversation.roomId
      })

      setNewMessage('')
      
      // Stop typing indicator
      sendTyping(selectedConversation.roomId, false)
      setIsTyping(false)
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleTyping = (e) => {
    const value = e.target.value
    setNewMessage(value)

    if (selectedConversation) {
      if (value.trim() && !isTyping) {
        setIsTyping(true)
        sendTyping(selectedConversation.roomId, true)
      } else if (!value.trim() && isTyping) {
        setIsTyping(false)
        sendTyping(selectedConversation.roomId, false)
      }
    }
  }

  const handleUserSelect = async (selectedUser) => {
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.otherUser._id === selectedUser._id
      )

      if (existingConv) {
        setSelectedConversation(existingConv)
      } else {
        // Create new conversation
        const roomId = [user._id, selectedUser._id].sort().join('_')
        const newConversation = {
          roomId,
          otherUser: selectedUser,
          lastMessage: { text: 'Start of conversation', createdAt: new Date() },
          unreadCount: 0
        }
        
        setConversations(prev => [newConversation, ...prev])
        setSelectedConversation(newConversation)
      }
    } catch (error) {
      toast.error('Failed to start conversation')
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <LoadingSpinner text="Loading conversations..." />
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Start new conversation"
              >
                <FiPlus size={18} />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.roomId}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.roomId === conversation.roomId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={conversation.otherUser.avatar || 'https://via.placeholder.com/40/007bff/ffffff?text=U'}
                      alt={conversation.otherUser.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.otherUser.username}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage.text}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedConversation.otherUser.avatar || 'https://via.placeholder.com/40/007bff/ffffff?text=U'}
                    alt={selectedConversation.otherUser.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.otherUser.username}
                    </h3>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.senderId._id === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId._id === user._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId._id === user._id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicators */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs ml-2">
                          {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiMessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500">
                  Choose a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Search Modal */}
      <UserSearch
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onUserSelect={handleUserSelect}
      />
    </div>
  )
}

export default Chat
