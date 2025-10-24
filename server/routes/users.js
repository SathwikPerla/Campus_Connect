const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { authMiddleware } = require('../middleware/Auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Get user profile
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ 
      userId: user._id, 
      isApproved: true 
    });

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        postCount
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
});

// Update user profile
router.put('/profile', [
  authMiddleware
], uploadSingle, handleUploadError, async (req, res) => {
  try {
    const { username, avatarUrl } = req.body;
    const userId = req.user._id;

    const updateData = {};
    
    if (username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      
      updateData.username = username;
    }
    
    // Handle avatar - either uploaded file or URL
    if (req.file) {
      // File was uploaded
      updateData.avatar = `/uploads/${req.file.filename}`;
    } else if (avatarUrl) {
      // Avatar URL was provided
      updateData.avatar = avatarUrl;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// Search users
router.get('/search/:query', authMiddleware, async (req, res) => {
  try {
    const query = req.params.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('-password')
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      users,
      totalUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
});

// Get user stats
router.get('/:userId/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;

    const postCount = await Post.countDocuments({ 
      userId, 
      isApproved: true 
    });

    const totalLikes = await Post.aggregate([
      { $match: { userId: userId, isApproved: true } },
      { $project: { likesCount: { $size: "$likes" } } },
      { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } }
    ]);

    res.json({
      success: true,
      stats: {
        postCount,
        totalLikes: totalLikes[0]?.totalLikes || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user stats'
    });
  }
});

module.exports = router;


