const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstagramAccount',
      required: true
    },
    type: {
      type: String,
      enum: ['comment', 'direct_message'],
      required: true
    },
    mediaId: {
      type: String
    },
    fromUser: {
      id: String,
      username: String,
      name: String,
      profilePicture: String
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    responded: {
      type: Boolean,
      default: false
    },
    response: {
      content: String,
      timestamp: Date,
      automated: Boolean,
      template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResponseTemplate'
      },
      aiGenerated: Boolean
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'unknown'],
      default: 'unknown'
    },
    intent: {
      type: String,
      enum: [
        'question', 
        'complaint', 
        'praise', 
        'inquiry', 
        'reservation', 
        'menu', 
        'hours', 
        'location', 
        'other',
        'unknown'
      ],
      default: 'unknown'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
interactionSchema.index({ accountId: 1, timestamp: -1 });
interactionSchema.index({ accountId: 1, type: 1, responded: 1 });
interactionSchema.index({ 'fromUser.username': 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction; 