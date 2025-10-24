import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import NotificationCenter from './NotificationCenter'
import { 
  FiHome, 
  FiUser, 
  FiMessageCircle, 
  FiPlus, 
  FiLogOut, 
  FiMenu,
  FiX,
  FiEye,
  FiEyeOff
} from 'react-icons/fi'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showWhisperMode, setShowWhisperMode] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleWhisperMode = () => {
    setShowWhisperMode(!showWhisperMode)
    // This would be used to filter anonymous posts
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold text-gray-900">WhisprNet</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/home" 
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiHome size={18} />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link 
                  to="/create" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FiPlus size={18} />
                  <span>Create</span>
                </Link>
                
                <Link 
                  to="/chat" 
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FiMessageCircle size={18} />
                  <span>Chat</span>
                </Link>

                <button
                  onClick={toggleWhisperMode}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
                    showWhisperMode 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {showWhisperMode ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  <span className="text-sm">Whisper Mode</span>
                </button>

                <div className="flex items-center space-x-3">
                  <NotificationCenter />
                  
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <img 
                      src={user?.avatar || 'https://via.placeholder.com/32/007bff/ffffff?text=U'} 
                      alt={user?.username} 
                      className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-blue-300 transition-colors"
                      title={`${user?.username}'s profile`}
                    />
                    <span className="hidden lg:block">{user?.username}</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <FiLogOut size={18} />
                    <span className="hidden lg:block">Logout</span>
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/home" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiHome size={18} />
                <span>Home</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link 
                    to="/create" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiPlus size={18} />
                    <span>Create Post</span>
                  </Link>
                  
                  <Link 
                    to="/chat" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiMessageCircle size={18} />
                    <span>Chat</span>
                  </Link>

                  <button
                    onClick={toggleWhisperMode}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      showWhisperMode 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {showWhisperMode ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    <span>Whisper Mode</span>
                  </button>

                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <img 
                      src={user?.avatar || 'https://via.placeholder.com/32/007bff/ffffff?text=U'} 
                      alt={user?.username} 
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{user?.username}</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <FiLogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
