import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiEdit, FiMessageCircle } from 'react-icons/fi'
import { format } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_ENDPOINTS } from '../config'

const Profile = () => {
  const { user: currentUser, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const { userId } = useParams()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [editData, setEditData] = useState({ username: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const profileUserId = userId || currentUser?._id
  const isOwnProfile = profileUserId === currentUser?._id

  // Fetch user profile
  const { data: profileData, isLoading, error, refetch } = useQuery(
    ['user', profileUserId],
    async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.USERS.PROFILE(profileUserId));
        return response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw new Error(error.response?.data?.message || 'Failed to load profile');
      }
    },
    {
      enabled: !!profileUserId,
      retry: 2,
      onSuccess: (data) => {
        setEditData({ username: data.user?.username || '' });
        if (data.user?.avatar) {
          setPreviewUrl(data.user.avatar);
        }
      },
      onError: (error) => {
        toast.error(error.message);
      }
    }
  )

  // Fetch user posts
  const { data: postsData, isLoading: postsLoading } = useQuery(
    ['userPosts', profileUserId],
    async () => {
      try {
        const response = await axios.get(
          `${API_ENDPOINTS.POSTS.GET_ALL}?userId=${profileUserId}`
        );
        return response.data;
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw new Error('Failed to load posts');
      }
    },
    {
      enabled: !!profileUserId,
      retry: 2,
      onError: (error) => {
        toast.error(error.message);
      }
    }
  )

  

  const handleMessageClick = async () => {
    try {
      setIsStartingConversation(true)
      const response = await axios.post(
        API_ENDPOINTS.CHAT.START_CONVERSATION,
        { otherUserId: profileUserId },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      if (response.data.success) {
        toast.success('Opening conversation...')
        // Redirect to chat page with the conversation
        navigate('/chat', { 
          state: { 
            selectedConversation: response.data.conversation,
            roomId: response.data.roomId
          } 
        })
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      const message = error.response?.data?.message || 'Failed to start conversation'
      toast.error(message)
    } finally {
      setIsStartingConversation(false)
    }
  }
  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    try {
      const formData = new FormData()
      formData.append('username', editData.username)
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      const response = await axios.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      toast.success('Profile updated successfully!')
      // Update AuthContext so Navbar + comment forms show new avatar immediately
      await refreshUser()
      // Refresh profile page data
      refetch()
      // Invalidate feed so posts show the new avatar when navigating back
      queryClient.invalidateQueries(['posts'])
      queryClient.invalidateQueries(['userPosts'])
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
    }
  }

  const handleCancel = () => {
    setEditData({ username: profileData?.user.username || '' })
    setSelectedFile(null)
    setPreviewUrl(profileData?.user.avatar || '')
    setIsEditing(false)
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading profile..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg font-medium mb-4">
          Failed to load profile
        </div>
        <button
          onClick={() => refetch()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  const user = profileData?.user
  const posts = postsData?.posts || []

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={editData.username}
                onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <img
                  src={previewUrl || 'https://via.placeholder.com/80/007bff/ffffff?text=U'}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                />
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, GIF or WebP — max 5MB
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button 
                onClick={handleCancel} 
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-6">
            <img 
              src={user?.avatar || 'https://via.placeholder.com/100/007bff/ffffff?text=U'} 
              alt={user?.username} 
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              title={`${user?.username}'s profile picture`}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.username}
                </h1>
                <div className="flex items-center space-x-2">
                  {isOwnProfile ? (
                    <button
                      onClick={handleEdit}
                      className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg transition-colors"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={handleMessageClick}
                      disabled={isStartingConversation}
                      className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <FiMessageCircle size={16} />
                      <span>{isStartingConversation ? 'Starting...' : 'Message'}</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span className="font-medium">{profileData?.postCount || 0} posts</span>
                <span>Joined {format(new Date(user?.createdAt), 'MMMM yyyy')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isOwnProfile ? 'Your Posts' : `${user?.username}'s Posts`}
        </h2>

        {postsLoading ? (
          <LoadingSpinner text="Loading posts..." />
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg font-medium mb-4">
              No posts yet
            </div>
            {isOwnProfile && (
              <Link to="/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Create Your First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile


