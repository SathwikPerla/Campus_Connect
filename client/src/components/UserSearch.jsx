import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FiSearch, FiUser, FiMessageCircle } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

const UserSearch = ({ onUserSelect, isOpen, onClose }) => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchUsers = async () => {
        setIsSearching(true)
        try {
          const response = await axios.get(`/api/users/search/${encodeURIComponent(searchQuery)}`)
          setSearchResults(response.data.users.filter(u => u._id !== user._id))
        } catch (error) {
          console.error('Search failed:', error)
        } finally {
          setIsSearching(false)
        }
      }

      const timeoutId = setTimeout(searchUsers, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, user])

  const handleUserSelect = (selectedUser) => {
    onUserSelect(selectedUser)
    onClose()
    setSearchQuery('')
    setSearchResults([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Start a Conversation</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiUser size={20} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="loading-spinner h-6 w-6 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2">
              {searchResults.map((searchUser) => (
                <div
                  key={searchUser._id}
                  onClick={() => handleUserSelect(searchUser)}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <img
                    src={searchUser.avatar || 'https://via.placeholder.com/40/007bff/ffffff?text=U'}
                    alt={searchUser.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {searchUser.username}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {searchUser.email}
                    </p>
                  </div>
                  <FiMessageCircle className="text-gray-400" size={18} />
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">
              <FiUser size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <FiSearch size={32} className="mx-auto mb-2 text-gray-300" />
              <p>Search for users to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserSearch




