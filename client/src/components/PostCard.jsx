import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { BASE_URL, getAvatarUrl } from '../config'
import {
  FiHeart,
  FiMessageCircle,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEyeOff,
  FiSend
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { API_ENDPOINTS } from '../config'
import toast from 'react-hot-toast'

const getImageUrl = (img) => {
  if (!img) return null
  if (img.startsWith('/uploads/')) return `${BASE_URL}${img}`
  return img
}

const CommentItem = ({ comment, currentUserId, onDelete, onLikeUpdate }) => {
  const [liked, setLiked] = useState(comment.likes?.includes(currentUserId) || false)
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0)

  const handleLike = async () => {
    if (!currentUserId) { toast.error('Please login to like'); return }
    try {
      const res = await axios.post(API_ENDPOINTS.COMMENTS.LIKE(comment._id))
      setLiked(res.data.isLiked)
      setLikeCount(res.data.likeCount)
    } catch {
      toast.error('Failed to like comment')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await axios.delete(API_ENDPOINTS.COMMENTS.DELETE(comment._id))
      onDelete(comment._id)
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const isOwner = currentUserId === comment.userId?._id

  return (
    <div className="flex space-x-2 py-2">
      <img
        src={getImageUrl(comment.userId?.avatar) || 'https://via.placeholder.com/32/007bff/ffffff?text=U'}
        alt={comment.userId?.username}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl px-3 py-2">
          <span className="font-semibold text-sm text-gray-900 mr-1.5">
            {comment.userId?.username}
          </span>
          <span className="text-sm text-gray-800 break-words">{comment.text}</span>
        </div>
        <div className="flex items-center space-x-3 mt-1 px-1">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-xs font-medium transition-colors ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <FiHeart size={11} className={liked ? 'fill-current' : ''} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          {isOwner && (
            <button
              onClick={handleDelete}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onLikeUpdate={onLikeUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id) || false)
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0)
  const [showActions, setShowActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)

  // Comments
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount || post.comments?.length || 0)

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const res = await axios.get(API_ENDPOINTS.COMMENTS.GET_BY_POST(post._id))
      setComments(res.data.comments || [])
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setCommentsLoading(false)
    }
  }

  const toggleComments = () => {
    if (!showComments) fetchComments()
    setShowComments(prev => !prev)
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    if (!user) { toast.error('Please login to comment'); return }

    setIsSubmitting(true)
    try {
      const res = await axios.post(API_ENDPOINTS.COMMENTS.CREATE, {
        postId: post._id,
        text: newComment.trim()
      })
      setComments(prev => [res.data.comment, ...prev])
      setCommentCount(prev => prev + 1)
      setNewComment('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(c => c._id !== commentId))
    setCommentCount(prev => Math.max(0, prev - 1))
  }

  const handleLike = async () => {
    if (!user) { toast.error('Please login to like posts'); return }
    setIsLoading(true)
    try {
      const res = await axios.post(API_ENDPOINTS.POSTS.LIKE(post._id))
      setIsLiked(res.data.isLiked)
      setLikeCount(res.data.likeCount)
    } catch {
      toast.error('Failed to update like')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editText.trim()) { toast.error('Post cannot be empty'); return }
    setIsLoading(true)
    try {
      const res = await axios.put(API_ENDPOINTS.POSTS.UPDATE(post._id), { text: editText })
      toast.success('Post updated successfully')
      setIsEditing(false)
      onUpdate?.(res.data.post)
    } catch {
      toast.error('Failed to update post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(post.text)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      await axios.delete(API_ENDPOINTS.POSTS.DELETE(post._id))
      toast.success('Post deleted successfully')
      onDelete?.(post._id)
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const isOwner = user?._id === post.userId?._id

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
                src={getAvatarUrl(post.userId?.avatar) || 'https://via.placeholder.com/40/007bff/ffffff?text=U'}
                alt={post.userId?.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              />
            </Link>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                {post.isAnonymous ? 'Anonymous User' : (
                  <Link to={`/profile/${post.userId?._id}`} className="hover:text-blue-600 transition-colors">
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
                  onClick={() => { setShowActions(false); setIsEditing(true) }}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 w-full"
                >
                  <FiEdit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => { setShowActions(false); handleDelete() }}
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
              <span className="text-sm text-gray-500">{editText.length}/2000 characters</span>
              <div className="flex space-x-2">
                <button onClick={handleCancelEdit} className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
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
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.text}</p>
        )}

        {post.image && (
          <div className="mt-3">
            <img
              src={getImageUrl(post.image)}
              alt="Post image"
              className="max-w-full h-auto rounded-lg"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center space-x-6 px-4 py-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center space-x-1 transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FiHeart size={20} className={isLiked ? 'fill-current' : ''} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center space-x-1 transition-colors ${
            showComments ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
          }`}
        >
          <FiMessageCircle size={20} />
          <span className="text-sm font-medium">{commentCount}</span>
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 pb-4">
          {/* Comment Input */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 pt-3 pb-2">
              <img
                src={getAvatarUrl(user.avatar) || 'https://via.placeholder.com/32/007bff/ffffff?text=U'}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                  maxLength={500}
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="text-blue-600 hover:text-blue-700 disabled:opacity-50 flex-shrink-0"
                  >
                    <FiSend size={16} />
                  </button>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-500 py-3 text-center">
              <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to comment
            </p>
          )}

          {/* Comments List */}
          <div className="mt-1">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-6">
                <FiMessageCircle size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    currentUserId={user?._id}
                    onDelete={handleCommentDelete}
                    onLikeUpdate={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCard
