import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { FiHeart, FiMessageSquare, FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

const CommentCard = ({ comment, onUpdate, onDelete, onReply }) => {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(comment.likes?.includes(user?._id) || false)
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0)
  const [showActions, setShowActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like comments')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(`/api/comments/${comment._id}/like`)
      setIsLiked(response.data.isLiked)
      setLikeCount(response.data.likeCount)
    } catch (error) {
      toast.error('Failed to update like')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    
    if (!replyText.trim()) return

    try {
      const response = await axios.post('/api/comments/create', {
        postId: comment.postId,
        text: replyText,
        parentComment: comment._id
      })

      toast.success('Reply posted!')
      setReplyText('')
      setIsReplying(false)
      onReply?.(response.data.comment)
    } catch (error) {
      toast.error('Failed to post reply')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      await axios.delete(`/api/comments/${comment._id}`)
      toast.success('Comment deleted successfully')
      onDelete?.(comment._id)
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const isOwner = user?._id === comment.userId?._id

  return (
    <div className="border-l-2 border-gray-100 pl-4 py-2">
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <img 
            src={comment.userId?.avatar || 'https://via.placeholder.com/24/007bff/ffffff?text=U'} 
            alt={comment.userId?.username} 
            className="w-6 h-6 rounded-full"
          />
          <span className="font-medium text-sm text-gray-900">
            {comment.userId?.username}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiMoreVertical size={14} />
            </button>

            {showActions && (
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setShowActions(false)
                    // Handle edit
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 w-full text-sm"
                >
                  <FiEdit size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setShowActions(false)
                    handleDelete()
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 w-full text-sm"
                >
                  <FiTrash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        <p className="text-gray-800 text-sm leading-relaxed">
          {comment.text}
        </p>
      </div>

      {/* Comment Actions */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center space-x-1 text-xs transition-colors ${
            isLiked 
              ? 'text-red-500' 
              : 'text-gray-500 hover:text-red-500'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FiHeart size={12} className={isLiked ? 'fill-current' : ''} />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => setIsReplying(!isReplying)}
          className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
        >
          <FiMessageSquare size={12} />
          <span>Reply</span>
        </button>
      </div>

      {/* Reply Form */}
      {isReplying && (
        <form onSubmit={handleReply} className="mt-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => {
                setIsReplying(false)
                setReplyText('')
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply._id}
              comment={reply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentCard


