const mongoose = require('mongoose');
const Restaurant = require('../models/restaurant.model');
const User = require('../models/user.model');

/**
 * Get restaurants for a specific user with filters and pagination
 */
exports.getUserRestaurants = async (req, res) => {
  try {
    // TEMPORARY FOR TESTING: Return test data
    // Remove this in production
    return res.json({
      success: true,
      restaurants: [{
        _id: "6807512dd6fdaf98be33ffc5",
        name: "Peni Ice Candy",
        location: "Bengaluru",
        cuisine: ["Ice Cream", "Desserts"],
        dishes: ["Malted brownie", "Tender coconut", "Biscoff", "Fruit salad"],
        visitStatus: "want_to_visit",
        mentionTexts: ["📍Peni Ice Candy, Bengaluru (HSR Layout, Koramangala, Residency Road)\n\nThey started in 1997 in Kottayam, Kerala with seven flavours. Now they More than 25 amazing flavours with Water, milk and cream based ice candies.\n\nThey are a very popular brand in South India with 50+ outlets in Kerala, Tamil Nadu, Telegana & Karnataka.\n\nDon't miss their Malted brownie, Tender coconut, Biscoff and fruit salad options."],
        mediaLink: "https://www.instagram.com/reel/18074860963774477",
        mentions: 2,
        extractionConfidence: { name: 0.9, location: 0.8, cuisine: 0.7, overall: 0.8 },
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1
      }
    });
    
    // Original code below - uncomment in production
    /*
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sort || 'lastMentioned';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    
    // Build filter object
    const filter = { userId };
    
    // Handle visit status filter
    if (req.query.visitStatus) {
      filter.visitStatus = req.query.visitStatus;
    }
    
    // Handle cuisine filter
    if (req.query.cuisine) {
      filter.cuisine = req.query.cuisine;
    }

    // Handle search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { 'cuisine': searchRegex },
        { 'dishes': searchRegex },
        { mentionTexts: searchRegex }
      ];
    }
    
    // Execute query with pagination
    const restaurants = await Restaurant.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get total count
    const total = await Restaurant.countDocuments(filter);
    
    res.json({
      success: true,
      restaurants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    */
  } catch (error) {
    console.error('Error fetching user restaurants:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch restaurants',
      error: error.message
    });
  }
};

/**
 * Get restaurant statistics for a user
 */
exports.getUserRestaurantStats = async (req, res) => {
  try {
    // TEMPORARY FOR TESTING: Return mock stats
    // Remove this in production
    return res.json({
      success: true,
      stats: {
        totalRecommendations: 1,
        visitStatusStats: {
          want_to_visit: 1,
          visited: 0,
          not_interested: 0
        },
        topCuisines: [
          { _id: "Ice Cream", count: 1 },
          { _id: "Desserts", count: 1 }
        ]
      }
    });
    
    // Original code below - uncomment in production
    /*
    const userId = req.user.id;
    
    // Get total count
    const totalRecommendations = await Restaurant.countDocuments({ userId });
    
    // Get visit status counts
    const visitStatusStats = await Restaurant.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { 
        _id: '$visitStatus', 
        count: { $sum: 1 } 
      }}
    ]);
    
    // Convert to object for easier consumption
    const visitStatusObject = {
      want_to_visit: 0,
      visited: 0,
      not_interested: 0
    };
    
    visitStatusStats.forEach(status => {
      if (status._id) {
        visitStatusObject[status._id] = status.count;
      }
    });
    
    // Get top cuisines
    const topCuisines = await Restaurant.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $unwind: '$cuisine' },
      { $group: { 
        _id: '$cuisine', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalRecommendations,
        visitStatusStats: visitStatusObject,
        topCuisines
      }
    });
    */
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch restaurant statistics',
      error: error.message
    });
  }
};

/**
 * Get available cuisines for a user
 */
exports.getUserCuisines = async (req, res) => {
  try {
    // TEMPORARY FOR TESTING: Return mock cuisines
    // Remove this in production
    return res.json({
      success: true,
      cuisines: ["Ice Cream", "Desserts"]
    });
    
    // Original code below - uncomment in production
    /*
    const userId = req.user.id;
    
    const cuisines = await Restaurant.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $unwind: '$cuisine' },
      { $group: { _id: '$cuisine' }},
      { $sort: { _id: 1 }}
    ]);
    
    res.json({
      success: true,
      cuisines: cuisines.map(item => item._id)
    });
    */
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch cuisines',
      error: error.message
    });
  }
};

/**
 * Update a restaurant's visit status
 */
exports.updateRestaurantStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const restaurantId = req.params.id;
    const { visitStatus } = req.body;
    
    if (!['want_to_visit', 'visited', 'not_interested'].includes(visitStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visit status'
      });
    }
    
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId,
      userId
    });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Update the visit status
    restaurant.visitStatus = visitStatus;
    
    // If marked as visited, set the visit date
    if (visitStatus === 'visited' && !restaurant.visitDate) {
      restaurant.visitDate = new Date();
    }
    
    await restaurant.save();
    
    res.json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Error updating restaurant status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update restaurant status',
      error: error.message
    });
  }
};

/**
 * Delete a restaurant
 */
exports.deleteRestaurant = async (req, res) => {
  try {
    const userId = req.user.id;
    const restaurantId = req.params.id;
    
    const result = await Restaurant.deleteOne({ 
      _id: restaurantId,
      userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete restaurant',
      error: error.message
    });
  }
};

/**
 * Get a specific restaurant by ID
 */
exports.getRestaurantById = async (req, res) => {
  try {
    const userId = req.user.id;
    const restaurantId = req.params.id;
    
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      userId
    });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch restaurant',
      error: error.message
    });
  }
}; 