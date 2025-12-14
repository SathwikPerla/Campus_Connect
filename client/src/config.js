// API Configuration
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5004";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: `${BASE_URL}/api/auth/register`,
    LOGIN: `${BASE_URL}/api/auth/login`,
    ME: `${BASE_URL}/api/auth/me`,
    FORGOT_PASSWORD: `${BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
  },
  
  // Posts endpoints
  POSTS: {
    BASE: `${BASE_URL}/api/posts`,
    CREATE: `${BASE_URL}/api/posts/create`,
    GET_ALL: `${BASE_URL}/api/posts`,
    GET_BY_ID: (id) => `${BASE_URL}/api/posts/${id}`,
    LIKE: (id) => `${BASE_URL}/api/posts/${id}/like`,
    UPDATE: (id) => `${BASE_URL}/api/posts/${id}`,
    DELETE: (id) => `${BASE_URL}/api/posts/${id}`,
  },
  
  // Comments endpoints
  COMMENTS: {
    BASE: `${BASE_URL}/api/comments`,
    CREATE: `${BASE_URL}/api/comments/create`,
    GET_ALL: `${BASE_URL}/api/comments`,
    GET_BY_POST: (postId) => `${BASE_URL}/api/comments/post/${postId}`,
    GET_BY_ID: (id) => `${BASE_URL}/api/comments/${id}`,
    LIKE: (id) => `${BASE_URL}/api/comments/${id}/like`,
    UPDATE: (id) => `${BASE_URL}/api/comments/${id}`,
    DELETE: (id) => `${BASE_URL}/api/comments/${id}`,
  },
  
  // Users endpoints
  USERS: {
    PROFILE: (userId) => `${BASE_URL}/api/users/profile/${userId}`,
    UPDATE_PROFILE: `${BASE_URL}/api/users/profile`,
    SEARCH: `${BASE_URL}/api/users/search`,
  },
  
  // Chat endpoints
  CHAT: {
    CONVERSATIONS: `${BASE_URL}/api/chat/conversations`,
    MESSAGES: (roomId) => `${BASE_URL}/api/chat/messages/${roomId}`,
    SEND: `${BASE_URL}/api/chat/send`,
  },
  
  // Utility endpoints
  HEALTH: `${BASE_URL}/api/health`,
  UPLOADS: (filename) => `${BASE_URL}/uploads/${filename}`,
};

// Socket configuration
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5006'  // Match your backend port
    : 'https://campus-connect-iomb.onrender.com');
