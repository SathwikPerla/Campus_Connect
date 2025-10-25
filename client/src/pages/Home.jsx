import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiPlus, FiRefreshCw } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_ENDPOINTS } from '../config'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Fetch posts
  const { data, isLoading, error, refetch } = useQuery(
    ['posts', page],
    async () => {
      const response = await axios.get(`${API_ENDPOINTS.POSTS.GET_ALL}?page=${page}&limit=10`)
      return response.data
    },
    {
      keepPreviousData: true,
      onSuccess: (data) => {
        if (page === 1) {
          setPosts(data.posts)
        } else {
          setPosts(prev => [...prev, ...data.posts])
        }
        setHasMore(data.pagination.hasNext)
      }
    }
  )

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const response = await axios.get(`/api/posts?page=${nextPage}&limit=10`)
      setPosts(prev => [...prev, ...response.data.posts])
      setPage(nextPage)
      setHasMore(response.data.pagination.hasNext)
    } catch (error) {
      toast.error('Failed to load more posts')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ))
  }

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId))
  }

  const handleRefresh = () => {
    setPage(1)
    setPosts([])
    refetch()
  }

  if (isLoading && page === 1) {
    return <LoadingSpinner text="Loading posts..." />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg font-medium mb-4">
          Failed to load posts
        </div>
        <button
          onClick={handleRefresh}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            WhisprNet
          </h1>
          <p className="text-sm text-gray-600">
            Share your thoughts with the community
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Refresh"
          >
            <FiRefreshCw size={20} />
          </button>
          
          {isAuthenticated && (
            <Link
              to="/create"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlus size={18} />
              <span>Create</span>
            </Link>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPlus size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            Be the first to share something with the community!
          </p>
          {isAuthenticated && (
            <Link
              to="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={handlePostUpdate}
              onDelete={handlePostDelete}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className={`bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors ${isLoadingMore ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner h-4 w-4"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More Posts'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

export default Home


