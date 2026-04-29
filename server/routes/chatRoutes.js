const express = require('express');
const { 
  startConversation,
  getMessages,
  sendMessage,
  getConversations,
  markMessagesAsRead,
  getUnreadCount
} = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/Auth');

const router = express.Router();

// ✅ Start or retrieve a conversation with a user
router.post('/start-conversation', authMiddleware, startConversation);

// Get chat messages between two users
router.get('/messages/:otherUserId', authMiddleware, getMessages);

// Send a new message
router.post('/send', authMiddleware, sendMessage);

// Get user's conversations
router.get('/conversations', authMiddleware, getConversations);

// Mark messages as read
router.put('/mark-read/:roomId', authMiddleware, markMessagesAsRead);

// Get unread message count
router.get('/unread-count', authMiddleware, getUnreadCount);

module.exports = router;
