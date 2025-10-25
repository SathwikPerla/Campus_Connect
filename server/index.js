const express = require('express');
const mongoose = require('mongoose');
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
const moderationMiddleware = require('./middleware/moderation');
const Message = require('./models/Message');
const { globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "https://campusconnect-psi.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "https://campusconnect-psi.vercel.app",
  credentials: true
}));

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
app.use('/uploads', express.static('uploads'));

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
