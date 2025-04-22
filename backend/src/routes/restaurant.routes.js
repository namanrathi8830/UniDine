const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const auth = require('../middleware/auth');

// Get all restaurants for a user with optional filtering
router.get('/', auth, restaurantController.getUserRestaurants);

// Get restaurant statistics for a user
router.get('/stats', auth, restaurantController.getUserRestaurantStats);

// Get available cuisines for a user
router.get('/cuisines', auth, restaurantController.getUserCuisines);

// Get a specific restaurant
router.get('/:id', auth, restaurantController.getRestaurantById);

// Update a restaurant's visit status
router.put('/:id/status', auth, restaurantController.updateRestaurantStatus);

// Delete a restaurant
router.delete('/:id', auth, restaurantController.deleteRestaurant);

module.exports = router; 