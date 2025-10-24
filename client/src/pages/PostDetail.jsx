import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import CommentCard from '../components/CommentCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiArrowLeft, FiMessageCircle, FiHeart } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch post details
  const { data: postData, isLoading, error, refetch } = useQuery(
    ['post', id],
    async () => {
      const response = await axios.get(`/api/posts/${id}`)
      return response.data
    },
    {
      enabled: !!id
    }
  )

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    if (!user) {
      toast.error('Please login to comment')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post('/api/comments/create', {
        postId: id,
        text: newComment
      })

      toast.success('Comment posted!')
      setNewComment('')
      refetch() // Refresh post data to show new comment
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to post comment'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading post..." />
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-medium mb-4">
            Failed to load post
          </div>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const post = postData?.post

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg font-medium mb-4">
            Post not found
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <FiArrowLeft size={18} />
        <span>Back</span>
      </button>

      {/* Post */}
      <div className="mb-8">
        <PostCard post={post} />
      </div>

      {/* Comments Section */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-6">
          <FiMessageCircle size={20} className="text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Comments ({post.comments?.length || 0})
          </h2>
        </div>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="flex space-x-3">
              <img 
                src={user.avatar || 'https://via.placeholder.com/32/007bff/ffffff?text=U'} 
                alt={user.username} 
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {newComment.length}/500 characters
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 border border-gray-200 rounded-lg mb-8">
            <p className="text-gray-600 mb-4">Please login to comment</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Login
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {post.comments && post.comments.length > 0 ? (
            post.comments
              .filter(comment => !comment.parentComment) // Only top-level comments
              .map((comment) => (
                <CommentCard
                  key={comment._id}
                  comment={comment}
                  onUpdate={() => refetch()}
                  onDelete={() => refetch()}
                  onReply={() => refetch()}
                />
              ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostDetail




