const mongoose = require('mongoose');

const responseTemplateSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InstagramAccount',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['comment', 'direct_message', 'both'],
      default: 'both'
    },
    triggers: [{
      type: String,
      trim: true
    }],
    // Keywords that would trigger this template when found in user message
    conditions: {
      sentiments: [{
        type: String,
        enum: ['positive', 'neutral', 'negative']
      }],
      intents: [{
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
          'other'
        ]
      }]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

const ResponseTemplate = mongoose.model('ResponseTemplate', responseTemplateSchema);

module.exports = ResponseTemplate; 