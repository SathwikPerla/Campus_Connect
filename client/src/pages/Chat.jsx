import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { useLocation } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import UserSearch from '../components/UserSearch'
import { FiPlus, FiMessageCircle, FiSend, FiSearch } from 'react-icons/fi'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BASE_URL, getAvatarUrl, API_ENDPOINTS } from '../config'

const formatMessageTime = (date) => {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'h:mm a')
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
  return format(d, 'MMM d, h:mm a')
}

const getSenderId = (msg) => msg.senderId?._id || msg.senderId

const Chat = () => {
  const { user } = useAuth()
  const { socket, joinRoom, sendMessage, sendTyping } = useSocket()
  const location = useLocation()
  const messagesEndRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)

  // ── Fetch conversations on mount ──────────────────────────────────────────
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(API_ENDPOINTS.CHAT.CONVERSATIONS, {
          withCredentials: true
        })

        let list = Array.isArray(response.data.conversations)
          ? response.data.conversations
          : []

        if (location.state?.selectedConversation) {
          const incoming = location.state.selectedConversation
          const exists = list.some(c => c.roomId === incoming.roomId)
          if (!exists) list = [incoming, ...list]
          setSelectedConversation(incoming)
          window.history.replaceState({}, document.title)
        }

        setConversations(list)
      } catch {
        setConversations([])
        toast.error('Failed to load conversations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // ── Load messages + join room whenever conversation changes ───────────────
  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      setIsLoadingMessages(true)
      setMessages([])
      try {
        const response = await axios.get(
          API_ENDPOINTS.CHAT.MESSAGES(selectedConversation.otherUser._id),
          { withCredentials: true }
        )
        setMessages(response.data.messages || [])
        joinRoom(selectedConversation.roomId)
      } catch {
        toast.error('Failed to load messages')
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [selectedConversation?.roomId])

  // ── Auto-scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleReceiveMessage = (message) => {
      // Add to chat panel if the message belongs to the open conversation
      setMessages(prev => {
        const roomId = message.roomId
        if (selectedConversation?.roomId === roomId) {
          return [...prev, message]
        }
        return prev
      })

      // Always update the sidebar preview
      setConversations(prev => {
        const roomId = message.roomId
        const exists = prev.some(c => c.roomId === roomId)
        if (exists) {
          return prev.map(c =>
            c.roomId === roomId ? { ...c, lastMessage: message } : c
          )
        }
        return prev
      })
    }

    const handleUserTyping = (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev =>
          data.isTyping
            ? [...prev.filter(u => u.userId !== data.userId), data]
            : prev.filter(u => u.userId !== data.userId)
        )
      }
    }

    const handleMessageError = (error) => {
      toast.error(error.error)
      setIsSending(false)
    }

    socket.on('receive-message', handleReceiveMessage)
    socket.on('user-typing', handleUserTyping)
    socket.on('message-error', handleMessageError)

    return () => {
      socket.off('receive-message', handleReceiveMessage)
      socket.off('user-typing', handleUserTyping)
      socket.off('message-error', handleMessageError)
    }
  }, [socket, user, selectedConversation])

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setIsSending(true)
    const text = newMessage.trim()
    setNewMessage('')
    sendTyping(selectedConversation.roomId, false)
    setIsTyping(false)

    try {
      sendMessage({
        senderId: user._id,
        receiverId: selectedConversation.otherUser._id,
        text,
        roomId: selectedConversation.roomId
      })
    } catch {
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleTyping = (e) => {
    const value = e.target.value
    setNewMessage(value)
    if (!selectedConversation) return
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      sendTyping(selectedConversation.roomId, true)
    } else if (!value.trim() && isTyping) {
      setIsTyping(false)
      sendTyping(selectedConversation.roomId, false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleUserSelect = (selectedUser) => {
    const existing = conversations.find(c => c.otherUser._id === selectedUser._id)
    if (existing) {
      setSelectedConversation(existing)
    } else {
      const roomId = [user._id, selectedUser._id].sort().join('_')
      const newConv = {
        roomId,
        otherUser: selectedUser,
        lastMessage: { text: 'Say hello 👋', createdAt: new Date() },
        unreadCount: 0
      }
      setConversations(prev => [newConv, ...prev])
      setSelectedConversation(newConv)
    }
    setShowUserSearch(false)
  }

  const filteredConversations = conversations.filter(c =>
    c?.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) return <LoadingSpinner text="Loading conversations..." />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Chats</h2>
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                title="New conversation"
              >
                <FiPlus size={16} />
              </button>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                {searchQuery ? 'No results' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.roomId === conv.roomId
                return (
                  <button
                    key={conv.roomId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left ${
                      isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={getAvatarUrl(conv.otherUser.avatar) || 'https://via.placeholder.com/40/007bff/ffffff?text=U'}
                        alt={conv.otherUser.username}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {conv.otherUser.username}
                        </span>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage?.text || ''}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Chat Panel ──────────────────────────────────────────────────── */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-3 px-4 py-3 border-b border-gray-200 bg-white">
              <img
                src={getAvatarUrl(selectedConversation.otherUser.avatar) || 'https://via.placeholder.com/40/007bff/ffffff?text=U'}
                alt={selectedConversation.otherUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.otherUser.username}
                </h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FiMessageCircle size={40} className="mb-2" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const senderId = getSenderId(message)
                  const isMine = senderId === user._id
                  const prevMsg = messages[index - 1]
                  const prevSender = prevMsg ? getSenderId(prevMsg) : null
                  const showAvatar = !isMine && prevSender !== senderId

                  return (
                    <div
                      key={message._id || index}
                      className={`flex items-end space-x-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Receiver avatar */}
                      {!isMine && (
                        <div className="w-6 flex-shrink-0">
                          {showAvatar && (
                            <img
                              src={getAvatarUrl(selectedConversation.otherUser.avatar) || 'https://via.placeholder.com/24/007bff/ffffff?text=U'}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                          }`}
                        >
                          {message.text}
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5 px-1">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-end space-x-2">
                  <img
                    src={getAvatarUrl(selectedConversation.otherUser.avatar) || 'https://via.placeholder.com/24/007bff/ffffff?text=U'}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-2xl rounded-bl-sm flex space-x-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <FiSend size={16} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <FiMessageCircle size={48} className="mx-auto mb-3" />
              <h3 className="font-medium text-gray-600 mb-1">Your Messages</h3>
              <p className="text-sm">Select a chat or start a new one</p>
            </div>
          </div>
        )}
      </div>

      <UserSearch
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onUserSelect={handleUserSelect}
      />
    </div>
  )
}

export default Chat
