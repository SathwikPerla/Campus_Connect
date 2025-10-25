// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check localStorage on load
  useEffect(() => {
    const token = localStorage.getItem('dummy_token');
    const username = localStorage.getItem('dummy_user');
    if (token && username) {
      setIsAuthenticated(true);
      setUser({ username });
    }
  }, []);

  // Dummy login
  const login = async (email, password) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Save dummy token and user
    const dummyToken = 'dummy_token_123';
    localStorage.setItem('dummy_token', dummyToken);
    localStorage.setItem('dummy_user', email.split('@')[0]);
    setIsAuthenticated(true);
    setUser({ username: email.split('@')[0] });

    return { success: true, token: dummyToken };
  };

  // Dummy register
  const register = async (username, email, password) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Save dummy token and user
    const dummyToken = 'dummy_token_123';
    localStorage.setItem('dummy_token', dummyToken);
    localStorage.setItem('dummy_user', username);
    setIsAuthenticated(true);
    setUser({ username });

    return { success: true, token: dummyToken };
  };

  const logout = () => {
    localStorage.removeItem('dummy_token');
    localStorage.removeItem('dummy_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for convenience
export const useAuth = () => useContext(AuthContext);

// import { createContext, useContext, useState, useEffect } from 'react'
// import axios from 'axios'
// import toast from 'react-hot-toast'
// import { API_ENDPOINTS } from '../config'

// const AuthContext = createContext()

// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [token, setToken] = useState(localStorage.getItem('token'))

//   // Configure axios defaults
//   useEffect(() => {
//     if (token) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
//     } else {
//       delete axios.defaults.headers.common['Authorization']
//     }
//   }, [token])

//   // Check if user is authenticated on app load
//   useEffect(() => {
//     const checkAuth = async () => {
//       if (token) {
//         try {
//           const response = await axios.get(API_ENDPOINTS.AUTH.ME)
//           setUser(response.data.user)
//         } catch (error) {
//           console.error('Auth check failed:', error)
//           localStorage.removeItem('token')
//           setToken(null)
//         }
//       }
//       setLoading(false)
//     }

//     checkAuth()
//   }, [token])

//   const login = async (email, password) => {
//     try {
//       const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password })
//       const { token: newToken, user: userData } = response.data
      
//       localStorage.setItem('token', newToken)
//       setToken(newToken)
//       setUser(userData)
      
//       toast.success('Login successful!')
//       return { success: true }
//     } catch (error) {
//       const message = error.response?.data?.message || 'Login failed'
//       toast.error(message)
//       return { success: false, message }
//     }
//   }

//   const register = async (username, email, password) => {
//     try {
//       const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, { username, email, password })
//       const { token: newToken, user: userData } = response.data
      
//       localStorage.setItem('token', newToken)
//       setToken(newToken)
//       setUser(userData)
      
//       toast.success('Registration successful!')
//       return { success: true }
//     } catch (error) {
//       const message = error.response?.data?.message || 'Registration failed'
//       toast.error(message)
//       return { success: false, message }
//     }
//   }



//   const forgotPassword = async (email) => {
//     try {
//       await axios.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
//       toast.success('Password reset email sent!')
//       return { success: true }
//     } catch (error) {
//       const message = error.response?.data?.message || 'Failed to send reset email'
//       toast.error(message)
//       return { success: false, message }
//     }
//   }

//   const resetPassword = async (token, password) => {
//     try {
//       await axios.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password })
//       toast.success('Password reset successful!')
//       return { success: true }
//     } catch (error) {
//       const message = error.response?.data?.message || 'Password reset failed'
//       toast.error(message)
//       return { success: false, message }
//     }
//   }

//   const logout = () => {
//     localStorage.removeItem('token')
//     setToken(null)
//     setUser(null)
//     delete axios.defaults.headers.common['Authorization']
//     toast.success('Logged out successfully!')
    
//     // Redirect to login page
//     window.location.href = '/login'
//   }

//   const updateProfile = async (profileData) => {
//     try {
//       const response = await axios.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, profileData)
//       setUser(response.data.user)
//       toast.success('Profile updated successfully!')
//       return { success: true }
//     } catch (error) {
//       const message = error.response?.data?.message || 'Profile update failed'
//       toast.error(message)
//       return { success: false, message }
//     }
//   }

//   const value = {
//     user,
//     token,
//     loading,
//     login,
//     register,
//     forgotPassword,
//     resetPassword,
//     logout,
//     updateProfile,
//     isAuthenticated: !!user
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }
