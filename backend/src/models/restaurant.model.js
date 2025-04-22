const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    default: 'Unknown Location'
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  cuisine: {
    type: [String],
    default: ['Unknown']
  },
  dishes: {
    type: [String],
    default: []
  },
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$', null],
    default: null
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: null
  },
  userNotes: {
    type: String,
    default: ''
  },
  photos: {
    type: [String],
    default: []
  },
  visited: {
    type: Boolean,
    default: false
  },
  visitDate: {
    type: Date,
    default: null
  },
  mentions: {
    type: Number,
    default: 1
  },
  extractionConfidence: {
    name: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    cuisine: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  firstMentioned: {
    type: Date,
    default: Date.now
  },
  lastMentioned: {
    type: Date,
    default: Date.now
  },
  mentionTexts: {
    type: [String],
    default: []
  },
  contactInfo: {
    phone: String,
    website: String,
    email: String,
    socialMedia: {
      instagram: String,
      facebook: String,
      twitter: String
    }
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  googlePlaceId: {
    type: String,
    default: null
  },
  googleData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

// Add compound index for user + restaurant name + location
restaurantSchema.index({ userId: 1, name: 1, location: 1 }, { unique: true });

// Add text index for search
restaurantSchema.index({ 
  name: 'text', 
  location: 'text', 
  cuisine: 'text',
  dishes: 'text'
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant; 