const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Moderation status
  isApproved: {
    type: Boolean,
    default: true
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  moderationHistory: [{
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'under_review'],
      required: true
    },
    reason: String,
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: {
      type: Date,
      default: Date.now
    },
    moderationId: String,
    confidence: Number,
    reasons: [String],
    metadata: mongoose.Schema.Types.Mixed
  }],
  // Auto-moderation results
  autoModeration: {
    isFlagged: Boolean,
    confidence: Number,
    categories: [{
      name: String,
      score: Number
    }],
    reasons: [String],
    moderationId: String,
    timestamp: Date,
    modelVersion: String
  },
  // User appeal information
  appeal: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    reason: String,
    submittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    text: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1 });
postSchema.index({ isApproved: 1 });

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);




