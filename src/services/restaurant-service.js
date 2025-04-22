const axios = require('axios');
const Restaurant = require('../models/Restaurant');
const { extractRestaurantInfo } = require('../utils/extractionUtils');

/**
 * Service for restaurant-related operations
 */
class RestaurantService {
  /**
   * Process a restaurant recommendation from a message
   * @param {string} message - The message containing the recommendation
   * @param {string} userId - The user ID who received the recommendation
   * @param {string} instagramUserId - The Instagram user ID who sent the recommendation (optional)
   * @returns {Promise<Object>} The processed restaurant object
   */
  async processRecommendation(message, userId, instagramUserId = null) {
    try {
      // Extract restaurant information from message
      const extractionResult = await extractRestaurantInfo(message);
      const { 
        restaurantName, 
        location, 
        dishes = [], 
        cuisine = [], 
        priceRange,
        confidence = 0
      } = extractionResult;

      if (!restaurantName) {
        throw new Error('No restaurant name could be extracted from the message');
      }

      // Create restaurant object
      let restaurant = {
        name: restaurantName,
        location: location || 'Unknown location',
        dishes,
        cuisine,
        priceRange: priceRange || 'Unknown',
        extractionConfidence: confidence,
        originalMessage: message,
        userId,
        fromInstagramId: instagramUserId,
        createdAt: new Date()
      };

      // Try to enrich with Google Places data if possible
      try {
        restaurant = await this.enrichWithGooglePlaces(restaurant);
      } catch (error) {
        console.warn('Could not enrich restaurant with Google Places data:', error.message);
        // Continue without enrichment
      }

      // Save to database
      const restaurantModel = new Restaurant(restaurant);
      await restaurantModel.save();
      
      return restaurantModel;
    } catch (error) {
      console.error('Error processing restaurant recommendation:', error);
      throw error;
    }
  }
  
  /**
   * Enrich restaurant data using Google Places API
   * @param {Object} restaurant - The restaurant object to enrich
   * @returns {Promise<Object>} The enriched restaurant object
   */
  async enrichWithGooglePlaces(restaurant) {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        throw new Error('Google Places API key is not configured');
      }

      // First, search for the place
      const searchQuery = `${restaurant.name} ${restaurant.location}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
      
      const searchResponse = await axios.get(searchUrl);
      
      if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
        throw new Error('No places found for this restaurant');
      }

      const place = searchResponse.data.results[0];
      const placeId = place.place_id;

      // Then, get place details
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,price_level,formatted_phone_number,website,opening_hours,photos&key=${apiKey}`;
      
      const detailsResponse = await axios.get(detailsUrl);
      
      if (!detailsResponse.data.result) {
        throw new Error('Could not get place details');
      }

      const details = detailsResponse.data.result;

      // Update restaurant with enhanced data
      const enhancedRestaurant = {
        ...restaurant,
        name: details.name || restaurant.name,
        location: details.formatted_address || restaurant.location,
        coordinates: details.geometry ? {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng
        } : undefined,
        rating: details.rating,
        priceRange: details.price_level ? '₽'.repeat(details.price_level) : restaurant.priceRange,
        phone: details.formatted_phone_number,
        website: details.website,
        googlePlaceId: placeId
      };

      // Add opening hours if available
      if (details.opening_hours && details.opening_hours.weekday_text) {
        enhancedRestaurant.hours = details.opening_hours.weekday_text;
      }

      // Add photo references if available
      if (details.photos && details.photos.length > 0) {
        enhancedRestaurant.photos = details.photos.slice(0, 5).map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        }));
      }

      return enhancedRestaurant;
    } catch (error) {
      console.warn('Error enriching with Google Places:', error.message);
      return restaurant; // Return original restaurant if enrichment fails
    }
  }
  
  /**
   * Get restaurants for a user with filtering and pagination
   * @param {string} userId - The user ID
   * @param {Object} options - Options for filtering and pagination
   * @returns {Promise<{restaurants: Array, total: number}>} Restaurants and total count
   */
  async getUserRestaurants(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        visited,
        favorite,
        cuisine,
        search
      } = options;

      const skip = (page - 1) * limit;
      
      // Build query
      const query = { userId };
      
      if (visited !== undefined) {
        query.visited = visited;
      }
      
      if (favorite) {
        query.favorite = favorite;
      }
      
      if (cuisine) {
        query.cuisine = { $in: [cuisine] };
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { dishes: { $elemMatch: { $regex: search, $options: 'i' } } }
        ];
      }
      
      // Execute query with pagination
      const restaurants = await Restaurant.find(query)
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Get total count
      const total = await Restaurant.countDocuments(query);
      
      return { restaurants, total };
    } catch (error) {
      console.error('Error getting user restaurants:', error);
      throw error;
    }
  }

  /**
   * Get a restaurant by ID for a specific user
   * @param {string} restaurantId - The restaurant ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} The restaurant object
   */
  async getRestaurantById(restaurantId, userId) {
    try {
      const restaurant = await Restaurant.findOne({
        _id: restaurantId,
        userId
      }).lean();
      
      return restaurant;
    } catch (error) {
      console.error('Error getting restaurant by ID:', error);
      throw error;
    }
  }

  /**
   * Update a restaurant
   * @param {string} restaurantId - The restaurant ID
   * @param {string} userId - The user ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object>} The updated restaurant
   */
  async updateRestaurant(restaurantId, userId, updates) {
    try {
      const restaurant = await Restaurant.findOneAndUpdate(
        { _id: restaurantId, userId },
        { $set: updates },
        { new: true }
      ).lean();
      
      return restaurant;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw error;
    }
  }

  /**
   * Delete a restaurant
   * @param {string} restaurantId - The restaurant ID
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} Whether the restaurant was deleted
   */
  async deleteRestaurant(restaurantId, userId) {
    try {
      const result = await Restaurant.deleteOne({
        _id: restaurantId,
        userId
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }
}

module.exports = { RestaurantService }; 