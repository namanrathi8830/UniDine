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
  mediaLink: String,
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
  // Look for patterns like "in X" or "at X"
  const locationMatch = message.match(/(?:in|at|located in|located at) ([\w\s',]+)(?:\.|\,|\n|$)/i);
  if (locationMatch) {
    return locationMatch[1].trim();
  }
  return "Unknown Location";
}

function extractCuisineTypes(message) {
  const cuisineTypes = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 
    'Thai', 'French', 'Greek', 'Spanish', 'Korean', 
    'Vietnamese', 'Mediterranean', 'American', 'Brazilian',
    'Vegetarian', 'Vegan', 'Seafood', 'BBQ', 'Pizza', 'Sushi'
  ];
  
  const foundCuisines = [];
  
  for (const cuisine of cuisineTypes) {
    if (message.toLowerCase().includes(cuisine.toLowerCase())) {
      foundCuisines.push(cuisine);
    }
  }
  
  return foundCuisines.length > 0 ? foundCuisines : ['Unknown'];
}

function isCommonWord(word) {
  const commonWords = [
    'the', 'and', 'but', 'for', 'nor', 'yet', 'so',
    'at', 'by', 'from', 'in', 'into', 'of', 'off',
    'on', 'onto', 'out', 'over', 'to', 'up', 'with',
    'this', 'that', 'these', 'those', 'they', 'them'
  ];
  
  return commonWords.includes(word.toLowerCase());
}

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

module.exports = { Restaurant }; 