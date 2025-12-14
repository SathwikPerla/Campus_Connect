const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authMiddleware, optionalAuth } = require('../middleware/Auth');
const moderationMiddleware = require('../middleware/moderation');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// Create post
router.post('/create', [
  authMiddleware,
  uploadSingle, 
  handleUploadError,
  body('text').isLength({ min: 1, max: 2000 }).withMessage('Post must be 1-2000 characters'),
  moderationMiddleware
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { text, imageUrl, isAnonymous, tags } = req.body;
    
    // Handle image - either uploaded file or URL
    let imagePath = null;
    if (req.file) {
      // File was uploaded
      imagePath = `/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      // Image URL was provided
      imagePath = imageUrl;
    }

    // Prepare moderation data
    const moderationData = {
      status: 'pending',
      moderatedAt: new Date(),
      moderationId: req.moderationResults?.moderationId || `mod-${require('uuid').v4()}`,
      confidence: req.moderationResults?.text?.confidence || 0,
      reasons: req.moderationResults?.text?.reasons || []
    };

    // Create the post with moderation data
    const post = new Post({
      userId: req.user._id,
      text,
      image: imagePath,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      moderationStatus: moderationData.status,
      moderationHistory: [{
        status: moderationData.status,
        moderatedAt: moderationData.moderatedAt,
        moderationId: moderationData.moderationId,
        confidence: moderationData.confidence,
        reasons: moderationData.reasons
      }],
      autoModeration: req.moderationResults?.text ? {
        isFlagged: req.moderationResults.text.isToxic || false,
        confidence: req.moderationResults.text.confidence || 0,
        reasons: req.moderationResults.text.reasons || [],
        moderationId: req.moderationResults.moderationId,
        timestamp: new Date(),
        modelVersion: '1.0.0'
      } : null
    });

    // If content was flagged but still allowed (e.g., in development), mark for review
    if (req.moderationResults?.text?.isToxic) {
      post.moderationStatus = 'under_review';
      post.isApproved = false;
      
      post.moderationHistory.push({
        status: 'under_review',
        reason: 'Auto-flagged content requiring review',
        moderatedAt: new Date(),
        moderationId: `review-${require('uuid').v4()}`,
        confidence: req.moderationResults.text.confidence,
        reasons: req.moderationResults.text.reasons
      });
    }

    await post.save();
    await post.populate('userId', 'username avatar');

    // Notify admins if content needs review
    if (post.moderationStatus === 'under_review') {
      // In a real app, you would send a notification to admin/moderation queue
      console.log(`Post ${post._id} requires moderation review`);
    }

    res.status(201).json({
      success: true,
      message: post.moderationStatus === 'under_review' 
        ? 'Your post is under review by our moderation team' 
        : 'Post created successfully',
      post,
      moderationStatus: post.moderationStatus
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all posts (with pagination)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isApproved: true })
      .populate('userId', 'username avatar')
      .populate('comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ isApproved: true });
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts'
    });
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'userId',
          select: 'username avatar'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching post'
    });
  }
});

// Like/Unlike post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      message: isLiked ? 'Post unliked' : 'Post liked',
      isLiked: !isLiked,
      likeCount: post.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating like'
    });
  }
});

// Update post
router.put('/:id', [
  authMiddleware,
  body('text').isLength({ min: 1, max: 2000 }).withMessage('Post must be 1-2000 characters'),
  moderationMiddleware
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this post'
      });
    }

    // Save edit history
    post.editHistory.push({
      text: post.text,
      editedAt: new Date()
    });

    post.text = req.body.text;
    post.isEdited = true;
    post.image = req.body.image || post.image;
    post.tags = req.body.tags || post.tags;

    await post.save();
    await post.populate('userId', 'username avatar');

    res.json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating post'
    });
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ postId: post._id });

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting post'
    });
  }
});

// Get user's posts
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      userId: req.params.userId, 
      isApproved: true 
    })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ 
      userId: req.params.userId, 
      isApproved: true 
    });

    res.json({
      success: true,
      posts,
      totalPosts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user posts'
    });
  }
});

module.exports = router;
