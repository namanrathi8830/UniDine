const authController = require('./auth.controller');
const instagramController = require('./instagram.controller');
const webhookController = require('./webhook.controller');
const restaurantExtractionController = require('./restaurant-extraction.controller');

module.exports = {
  authController,
  instagramController,
  webhookController,
  restaurantExtractionController
}; 