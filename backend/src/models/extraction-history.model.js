const mongoose = require('mongoose');

const extractionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalText: {
    type: String,
    required: true
  },
  extractionResult: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add index for faster queries
extractionHistorySchema.index({ userId: 1, timestamp: -1 });

const ExtractionHistory = mongoose.model('ExtractionHistory', extractionHistorySchema);

module.exports = ExtractionHistory; 