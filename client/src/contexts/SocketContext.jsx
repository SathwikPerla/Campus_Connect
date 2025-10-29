import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { SOCKET_URL } from '../config'
import { toast } from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user && !socketRef.current) {
      console.log('Initializing socket connection to:', SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token'),
          userId: user._id,
          username: user.username
        },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true,
        transports: ['websocket', 'polling']
      });

      // Connection established
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        socketRef.current = newSocket;
      });

      // Connection error
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        
        // Show error toast for connection issues
        if (error.message === 'xhr poll error') {
          toast.error('Connection to server failed. Trying to reconnect...');
        }
      });

      // Disconnected
      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // The server has forcefully disconnected the socket
          // You might want to attempt to reconnect after a delay
          setTimeout(() => {
            newSocket.connect();
          }, 1000);
        }
      });

      // Reconnection attempts
      newSocket.on('reconnect_attempt', (attempt) => {
        console.log(`Reconnection attempt ${attempt}`);
      });

      // Reconnected
      newSocket.on('reconnect', (attempt) => {
        console.log(`Reconnected after ${attempt} attempts`);
        setIsConnected(true);
      });

      // Reconnection failed
      newSocket.on('reconnect_failed', () => {
        console.error('Failed to reconnect');
        toast.error('Failed to connect to the server. Please refresh the page.');
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);
      socketRef.current = newSocket;

      // Cleanup function
      return () => {
        console.log('Cleaning up socket connection');
        if (newSocket) {
          newSocket.off('connect');
          newSocket.off('disconnect');
          newSocket.off('connect_error');
          newSocket.off('reconnect_attempt');
          newSocket.off('reconnect');
          newSocket.off('reconnect_failed');
          newSocket.off('error');
          newSocket.close();
          socketRef.current = null;
        }
      };
    } else if (!isAuthenticated && socketRef.current) {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, user])

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join-room', roomId)
    }
  }

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send-message', messageData)
    }
  }

  const sendTyping = (roomId, isTyping) => {
    if (socket && user) {
      socket.emit('typing', {
        roomId,
        userId: user._id,
        username: user.username,
        isTyping
      })
    }
  }

  const value = {
    socket,
    isConnected,
    joinRoom,
    sendMessage,
    sendTyping
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}



