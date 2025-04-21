const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const InstagramClient = require('../services/instagram-client');

// Get Instagram connection status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('instagramId instagramUsername');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has Instagram connected
    const connected = !!user.instagramId;
    
    if (connected) {
      // If connected, return status and basic profile info
      return res.json({
        connected: true,
        user: {
          instagram_id: user.instagramId,
          username: user.instagramUsername
        }
      });
    } else {
      return res.json({ connected: false });
    }
  } catch (err) {
    console.error('Error getting Instagram status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Disconnect Instagram account
router.post('/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Clear Instagram connection data
    user.instagramId = undefined;
    user.instagramUsername = undefined;
    user.instagramAccessToken = undefined;
    user.tokenExpiry = undefined;
    
    await user.save();
    
    res.json({ message: 'Instagram account disconnected successfully' });
  } catch (err) {
    console.error('Error disconnecting Instagram:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's restaurants from Instagram recommendations
router.get('/restaurants', auth, async (req, res) => {
  try {
    // Get query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const visitStatus = req.query.visitStatus;
    const cuisine = req.query.cuisine;
    
    // Build filter
    const filter = { 
      userId: req.user.id,
      source: 'instagram'
    };
    
    if (visitStatus) {
      filter.visitStatus = visitStatus;
    }
    
    if (cuisine) {
      filter.cuisine = cuisine;
    }
    
    // Execute query with pagination
    const restaurants = await Restaurant.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);
      
    // Get total count for pagination
    const total = await Restaurant.countDocuments(filter);
    
    res.json({
      restaurants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching restaurants:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update restaurant details
router.put('/restaurants/:id', auth, async (req, res) => {
  try {
    const { name, location, cuisine, priceRange, rating, notes, visitStatus } = req.body;
    
    // Find restaurant by ID and ensure it belongs to the user
    const restaurant = await Restaurant.findOne({ 
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or not authorized' });
    }
    
    // Update fields if provided
    if (name) restaurant.name = name;
    if (location) restaurant.location = location;
    if (cuisine) restaurant.cuisine = cuisine;
    if (priceRange) restaurant.priceRange = priceRange;
    if (rating) restaurant.rating = rating;
    if (notes) restaurant.notes = notes;
    if (visitStatus) restaurant.visitStatus = visitStatus;
    
    // Save updated restaurant
    await restaurant.save();
    
    res.json(restaurant);
  } catch (err) {
    console.error('Error updating restaurant:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a restaurant
router.delete('/restaurants/:id', auth, async (req, res) => {
  try {
    // Find and remove restaurant, ensuring it belongs to the user
    const result = await Restaurant.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Restaurant not found or not authorized' });
    }
    
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    console.error('Error deleting restaurant:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Instagram statistics and insights
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get counts of restaurants by status
    const statusCounts = await Restaurant.aggregate([
      { $match: { userId: userId, source: 'instagram' } },
      { $group: { _id: '$visitStatus', count: { $sum: 1 } } }
    ]);
    
    // Format the status counts
    const visitStatusStats = {
      want_to_visit: 0,
      visited: 0,
      not_interested: 0
    };
    
    statusCounts.forEach(item => {
      if (item._id in visitStatusStats) {
        visitStatusStats[item._id] = item.count;
      }
    });
    
    // Get counts by cuisine
    const cuisineCounts = await Restaurant.aggregate([
      { $match: { userId: userId, source: 'instagram' } },
      { $unwind: '$cuisine' },
      { $group: { _id: '$cuisine', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get most recent recommendations
    const recentActivity = await Restaurant.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt visitStatus');
    
    res.json({
      visitStatusStats,
      topCuisines: cuisineCounts,
      recentActivity,
      totalRecommendations: await Restaurant.countDocuments({ userId, source: 'instagram' })
    });
  } catch (err) {
    console.error('Error getting Instagram stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 