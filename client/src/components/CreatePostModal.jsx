import { useState } from 'react'
import { FiX, FiImage, FiTag } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    text: '',
    image: '',
    isAnonymous: false,
    tags: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.text.trim()) {
      toast.error('Please enter some text for your post')
      return
    }

    setIsLoading(true)
    try {
      const tags = formData.tags 
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : []

      const response = await axios.post('/api/posts/create', {
        text: formData.text,
        image: formData.image || null,
        isAnonymous: formData.isAnonymous,
        tags
      })

      toast.success('Post created successfully!')
      setFormData({ text: '', image: '', isAnonymous: false, tags: '' })
      onPostCreated?.(response.data.post)
      onClose()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create post'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6">
            <img 
              src={user?.avatar || 'https://via.placeholder.com/40/007bff/ffffff?text=U'} 
              alt={user?.username} 
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium text-gray-900">{user?.username}</h3>
              <p className="text-sm text-gray-500">Posting to WhisprNet</p>
            </div>
          </div>

          {/* Whisper Mode Toggle */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <FiX className="text-white" size={12} />
                </div>
                <span className="font-medium text-gray-900">Whisper Mode</span>
                <span className="text-sm text-gray-500">(Post anonymously)</span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              Your username will be hidden and replaced with "Anonymous User"
            </p>
          </div>

          {/* Post Text */}
          <div className="mb-6">
            <textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="What's on your mind?"
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {formData.text.length}/2000 characters
              </span>
            </div>
          </div>

          {/* Image URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (optional)
            </label>
            <div className="relative">
              <FiImage className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <div className="relative">
              <FiTag className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="tag1, tag2, tag3"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas
            </p>
          </div>

          {/* Preview */}
          {formData.image && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Preview
              </label>
              <img 
                src={formData.image} 
                alt="Preview" 
                className="max-w-full h-48 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none'
                  toast.error('Invalid image URL')
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal




