const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/Auth');

const router = express.Router();

// Get chat messages between two users
router.get('/messages/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.otherUserId;
    
    // Create room ID (consistent ordering)
    const roomId = [currentUserId, otherUserId].sort().join('_');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ roomId })
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      { 
        roomId, 
        receiverId: currentUserId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      roomId
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    });
  }
});

// Send message
router.post('/send', [
  authMiddleware
], async (req, res) => {
  try {
    const { receiverId, text, messageType = 'text', attachment } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message text are required'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create room ID
    const roomId = [senderId, receiverId].sort().join('_');

    const message = new Message({
      senderId,
      receiverId,
      text,
      roomId,
      messageType,
      attachment: attachment || null
    });

    await message.save();
    await message.populate('senderId', 'username avatar');
    await message.populate('receiverId', 'username avatar');

    res.status(201).json({
      success: true,
      message: message,
      roomId
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending message'
    });
  }
});

// Get user's conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique conversations for this user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$roomId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.senderId',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiverId',
          foreignField: '_id',
          as: 'receiver'
        }
      },
      {
        $project: {
          roomId: '$_id',
          lastMessage: 1,
          unreadCount: 1,
          otherUser: {
            $cond: [
              { $eq: ['$lastMessage.senderId', userId] },
              { $arrayElemAt: ['$receiver', 0] },
              { $arrayElemAt: ['$sender', 0] }
            ]
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching conversations'
    });
  }
});

// Mark messages as read
router.put('/mark-read/:roomId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const roomId = req.params.roomId;

    await Message.updateMany(
      { 
        roomId, 
        receiverId: userId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking messages as read'
    });
  }
});

// Get unread message count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching unread count'
    });
  }
});

module.exports = router;




