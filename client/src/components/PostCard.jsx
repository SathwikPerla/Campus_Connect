import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { 
  FiHeart, 
  FiMessageCircle, 
  FiMoreVertical, 
  FiEdit, 
  FiTrash2,
  FiUser,
  FiEye,
  FiEyeOff
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id) || false)
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0)
  const [showActions, setShowActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(`/api/posts/${post._id}/like`)
      setIsLiked(response.data.isLiked)
      setLikeCount(response.data.likeCount)
    } catch (error) {
      toast.error('Failed to update like')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editText.trim()) {
      toast.error('Post cannot be empty')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.put(`/api/posts/${post._id}`, {
        text: editText
      })
      
      toast.success('Post updated successfully')
      setIsEditing(false)
      onUpdate?.(response.data.post)
    } catch (error) {
      toast.error('Failed to update post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(post.text)
    setIsEditing(false)
  }

  const isOwner = user?._id === post.userId?._id

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      await axios.delete(`/api/posts/${post._id}`)
      toast.success('Post deleted successfully')
      onDelete?.(post._id)
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${post.isAnonymous ? 'whisper-mode' : ''} hover:shadow-md transition-shadow duration-200`}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          {post.isAnonymous ? (
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FiEyeOff className="text-white" size={20} />
            </div>
          ) : (
            <Link to={`/profile/${post.userId?._id}`}>
              <img 
                src={post.userId?.avatar || 'https://via.placeholder.com/40/007bff/ffffff?text=U'} 
                alt={post.userId?.username} 
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                title={`View ${post.userId?.username}'s profile`}
              />
            </Link>
          )}
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                {post.isAnonymous ? 'Anonymous User' : (
                  <Link 
                    to={`/profile/${post.userId?._id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {post.userId?.username}
                  </Link>
                )}
              </h3>
              {post.isAnonymous && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  Whisper Mode
                </span>
              )}
              {post.isEdited && (
                <span className="text-xs text-gray-400 italic">(edited)</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>


        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiMoreVertical size={18} />
            </button>

            {showActions && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setShowActions(false)
                    setIsEditing(true)
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 w-full"
                >
                  <FiEdit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setShowActions(false)
                    handleDelete()
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 w-full"
                >
                  <FiTrash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 pb-2">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={2000}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {editText.length}/2000 characters
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.text}
          </p>
        )}
        
        {post.image && (
          <div className="mt-3">
            <img 
              src={post.image.startsWith('http') ? post.image : `http://localhost:5004${post.image}`} 
              alt="Post image" 
              className="max-w-full h-auto rounded-lg"
              onError={(e) => {
                console.error('Image load error:', e.target.src)
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked 
                ? 'text-red-500' 
                : 'text-gray-500 hover:text-red-500'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiHeart size={20} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          <Link 
            to={`/post/${post._id}`}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <FiMessageCircle size={20} />
            <span className="text-sm font-medium">{post.commentCount || post.comments?.length || 0}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PostCard
