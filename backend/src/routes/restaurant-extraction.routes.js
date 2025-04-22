const express = require('express');
const { restaurantExtractionController } = require('../controllers');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// Extract restaurant info from text
router.post('/extract', 
  authMiddleware.authenticate,
  restaurantExtractionController.extractFromText
);

// Save extracted restaurant to database
router.post('/save',
  authMiddleware.authenticate,
  restaurantExtractionController.saveExtractedRestaurant
);

// Get extraction history for the user
router.get('/history',
  authMiddleware.authenticate,
  restaurantExtractionController.getExtractionHistory
);

module.exports = router; 