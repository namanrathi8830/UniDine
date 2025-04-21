const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  profilePicture: {
    type: String
  },
  instagramId: {
    type: String,
    unique: true,
    sparse: true
  },
  instagramUsername: {
    type: String
  },
  instagramAccessToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  }
});

// Pre-save hook to update the updatedAt field
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find a user by their Instagram ID
UserSchema.statics.findByInstagramId = async function(instagramId) {
  return this.findOne({ instagramId });
};

// Method to connect a user's Instagram account
UserSchema.methods.connectInstagram = async function(instagramData) {
  this.instagramId = instagramData.id;
  this.instagramUsername = instagramData.username;
  this.instagramAccessToken = instagramData.accessToken;
  this.tokenExpiry = instagramData.tokenExpiry;
  return this.save();
};

module.exports = mongoose.model('User', UserSchema); 