const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  cuisine: {
    type: [String],
    default: []
  },
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$', 'Unknown'],
    default: 'Unknown'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  images: [String],
  contactInfo: {
    phone: String,
    website: String,
    socialMedia: {
      instagram: String,
      facebook: String,
      twitter: String
    }
  },
  hours: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String
  },
  features: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'instagram'
  },
  originalMessage: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instagramUserId: {
    type: String
  },
  processed: {
    type: Boolean,
    default: false
  },
  visitStatus: {
    type: String,
    enum: ['want_to_visit', 'visited', 'not_interested'],
    default: 'want_to_visit'
  },
  notes: {
    type: String
  }
});

// Pre-save hook to update the updatedAt field
RestaurantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to extract information from a message
RestaurantSchema.statics.extractFromMessage = async function(message, userId, instagramUserId) {
  // This would ideally call an AI service like OpenAI to extract structured information
  // For now, we'll use a simple extraction logic
  
  const extractedInfo = {
    name: extractRestaurantName(message),
    location: extractLocation(message),
    cuisine: extractCuisineTypes(message),
    originalMessage: message,
    userId,
    instagramUserId
  };
  
  return new this(extractedInfo);
};

// Helper functions for extraction (simplified versions)
function extractRestaurantName(message) {
  // Look for patterns like "restaurant called X" or "X restaurant"
  const nameMatch = message.match(/restaurant (?:called|named) ([\w\s'&]+)|([\w\s'&]+) restaurant/i);
  if (nameMatch) {
    return (nameMatch[1] || nameMatch[2]).trim();
  }
  
  // If no explicit pattern is found, try to extract the first proper noun
  const words = message.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length > 2 && word[0] === word[0].toUpperCase() && !isCommonWord(word)) {
      return word;
    }
  }
  
  return "Unknown Restaurant";
}

function extractLocation(message) {
  // Look for patterns like "in X" or "at X" or "located in X"
  const locationMatch = message.match(/(?:in|at|located in) ([\w\s,]+)(?:\.|\s|$)/i);
  return locationMatch ? locationMatch[1].trim() : "Unknown Location";
}

function extractCuisineTypes(message) {
  const cuisineTypes = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'French', 
    'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Spanish', 
    'Turkish', 'Lebanese', 'Brazilian', 'Peruvian'
  ];
  
  const foundCuisines = [];
  cuisineTypes.forEach(cuisine => {
    if (message.toLowerCase().includes(cuisine.toLowerCase())) {
      foundCuisines.push(cuisine);
    }
  });
  
  return foundCuisines.length > 0 ? foundCuisines : ['Unknown'];
}

function isCommonWord(word) {
  const commonWords = ['the', 'and', 'but', 'for', 'nor', 'yet', 'so', 'as', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'it', 'is'];
  return commonWords.includes(word.toLowerCase());
}

module.exports = mongoose.model('Restaurant', RestaurantSchema); 