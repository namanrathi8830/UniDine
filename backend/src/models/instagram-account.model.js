const mongoose = require('mongoose');

const instagramAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    igBusinessId: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true
    },
    name: {
      type: String
    },
    profilePicture: {
      type: String
    },
    accessToken: {
      type: String,
      required: true
    },
    tokenExpiry: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    followerCount: {
      type: Number,
      default: 0
    },
    mediaCount: {
      type: Number,
      default: 0
    },
    lastSync: {
      type: Date
    },
    automationSettings: {
      replyToComments: {
        enabled: {
          type: Boolean,
          default: false
        },
        templates: [
          {
            name: String,
            content: String,
            triggers: [String]
          }
        ]
      },
      replyToDMs: {
        enabled: {
          type: Boolean,
          default: false
        },
        templates: [
          {
            name: String,
            content: String,
            triggers: [String]
          }
        ]
      },
      useAI: {
        type: Boolean,
        default: false
      },
      aiPrompt: {
        type: String,
        default: "You are a helpful assistant representing a restaurant. Be friendly, professional, and helpful."
      }
    }
  },
  { timestamps: true }
);

const InstagramAccount = mongoose.model('InstagramAccount', instagramAccountSchema);

module.exports = InstagramAccount; 