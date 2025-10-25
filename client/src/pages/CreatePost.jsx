import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiX, FiImage, FiTag, FiUpload, FiLink } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API_ENDPOINTS } from '../config'

const CreatePost = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    text: '',
    imageUrl: '',
    isAnonymous: false,
    tags: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState('url') // 'url' or 'file'
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

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

      const formDataToSend = new FormData()
      formDataToSend.append('text', formData.text)
      formDataToSend.append('isAnonymous', formData.isAnonymous)
      
      // Only append tags if there are any
      if (tags.length > 0) {
        formDataToSend.append('tags', tags.join(','))
      }

      if (uploadMethod === 'file' && selectedFile) {
        formDataToSend.append('image', selectedFile)
      } else if (uploadMethod === 'url' && formData.imageUrl) {
        formDataToSend.append('imageUrl', formData.imageUrl)
      }

      const response = await axios.post(API_ENDPOINTS.POSTS.CREATE, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success('Post created successfully!')
      navigate('/home')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create post'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/home')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleImageUrlChange = (e) => {
    setFormData(prev => ({ ...prev, imageUrl: e.target.value }))
    setPreviewUrl(e.target.value)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3">
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
          <div>
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
          <div>
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

          {/* Image Upload Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Image (optional)
            </label>
            
            {/* Upload Method Toggle */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  uploadMethod === 'url' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiLink size={16} />
                <span>Image URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  uploadMethod === 'file' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiUpload size={16} />
                <span>Upload File</span>
              </button>
            </div>

            {/* Image URL Input */}
            {uploadMethod === 'url' && (
              <div className="relative">
                <FiImage className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* File Upload Input */}
            {uploadMethod === 'file' && (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
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
          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Preview
              </label>
              <img 
                src={previewUrl} 
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
              onClick={handleCancel}
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

export default CreatePost


