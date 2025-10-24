const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  roomId: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachment: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });

// Compound index for conversation queries
messageSchema.index({ 
  $or: [
    { senderId: 1, receiverId: 1 },
    { senderId: 1, receiverId: 1 }
  ]
});

module.exports = mongoose.model('Message', messageSchema);




