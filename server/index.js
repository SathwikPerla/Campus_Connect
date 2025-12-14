const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
require('dotenv').config();

const authRoutes = require('./routes/Auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const moderationRoutes = require('./routes/moderation');
const moderationMiddleware = require('./middleware/moderation');
const Message = require('./models/Message');
const { globalErrorHandler } = require('./middleware/errorHandler');

const allowedOrigins = [
  "http://localhost:5173",
  "https://campusconnect-psi.vercel.app",
  "https://campus-connect-client.onrender.com",
  "http://campus-connect-client.onrender.com",
  "https://campus-connect-iomb.onrender.com",
  "http://campus-connect-iomb.onrender.com"
];

const app = express();
const server = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://campusconnect-psi.vercel.app',
      'https://campus-connect-client.onrender.com',
      'http://campus-connect-client.onrender.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400
};

// Enable CORS pre-flight for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Initialize Passport
app.use(passport.initialize());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WhisprNet Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/moderation', moderationRoutes);
app.use("/api/profile", userRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      // Save message to database
      const message = new Message({
        senderId: data.senderId,
        receiverId: data.receiverId,
        text: data.text,
        roomId: data.roomId,
        messageType: data.messageType || 'text',
        attachment: data.attachment || null
      });

      await message.save();
      await message.populate('senderId', 'username avatar');
      await message.populate('receiverId', 'username avatar');

      // Emit to all users in the room
      io.to(data.roomId).emit('receive-message', message);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global error handler
app.use(globalErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/WhisprNetDB')
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5004;
    server.listen(PORT, () => {
      console.log(`WhisprNet Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    // Try local MongoDB as fallback
    console.log('Attempting to connect to local MongoDB...');
    mongoose.connect('mongodb://localhost:27017/WhisprNetDB')
      .then(() => {
        console.log('Connected to local MongoDB');
        const PORT = process.env.PORT || 5004;
        server.listen(PORT, () => {
          console.log(`WhisprNet Server running on port ${PORT}`);
        });
      })
      .catch((localError) => {
        console.error('Local MongoDB connection also failed:', localError);
        process.exit(1);
      });
  });

module.exports = { app, io };
