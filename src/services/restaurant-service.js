const Restaurant = require('../models/Restaurant');
const axios = require('axios');

/**
 * Service for restaurant-related operations
 */
class RestaurantService {
  /**
   * Process a restaurant recommendation from a message
   * @param {String} message - The message text containing restaurant info
   * @param {String} userId - User ID who submitted the recommendation
   * @param {String} instagramUserId - Instagram user ID (if from Instagram)
   * @returns {Promise<Object>} The saved restaurant object
   */
  async processRecommendation(message, userId, instagramUserId = null) {
    try {
      // Use the Restaurant model to extract information from the message
      const restaurant = await Restaurant.extractFromMessage(message, userId, instagramUserId);
      
      // If we have Google Places API key, we could enrich the data
      if (process.env.GOOGLE_MAPS_API_KEY && restaurant.name !== 'Unknown Restaurant') {
        await this.enrichWithGooglePlaces(restaurant);
      }
      
      // Save to database
      await restaurant.save();
      
      return restaurant;
    } catch (error) {
      console.error('Error processing restaurant recommendation:', error);
      throw error;
    }
  }
  
  /**
   * Enrich restaurant data with information from Google Places API
   * @param {Object} restaurant - Restaurant object to enrich
   * @returns {Promise<Object>} Updated restaurant object
   */
  async enrichWithGooglePlaces(restaurant) {
    try {
      if (!process.env.GOOGLE_MAPS_API_KEY) {
        return restaurant;
      }
      
      // Search for the restaurant
      const query = `${restaurant.name} ${restaurant.location !== 'Unknown Location' ? restaurant.location : ''}`;
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        const place = response.data.results[0];
        
        // Update restaurant with Google Places data
        restaurant.name = place.name;
        restaurant.location = place.formatted_address;
        
        if (place.geometry && place.geometry.location) {
          restaurant.coordinates = {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          };
        }
        
        if (place.rating) {
          restaurant.rating = place.rating;
        }
        
        if (place.price_level) {
          const priceMap = {
            1: '$',
            2: '$$',
            3: '$$$',
            4: '$$$$'
          };
          restaurant.priceRange = priceMap[place.price_level] || restaurant.priceRange;
        }
        
        // Get place details for more information
        const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
          params: {
            place_id: place.place_id,
            fields: 'formatted_phone_number,website,opening_hours',
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        });
        
        if (detailsResponse.data.result) {
          const details = detailsResponse.data.result;
          
          // Update contact info
          if (!restaurant.contactInfo) {
            restaurant.contactInfo = {};
          }
          
          if (details.formatted_phone_number) {
            restaurant.contactInfo.phone = details.formatted_phone_number;
          }
          
          if (details.website) {
            restaurant.contactInfo.website = details.website;
          }
          
          // Update hours
          if (details.opening_hours && details.opening_hours.weekday_text) {
            const hours = {
              monday: details.opening_hours.weekday_text[0],
              tuesday: details.opening_hours.weekday_text[1],
              wednesday: details.opening_hours.weekday_text[2],
              thursday: details.opening_hours.weekday_text[3],
              friday: details.opening_hours.weekday_text[4],
              saturday: details.opening_hours.weekday_text[5],
              sunday: details.opening_hours.weekday_text[6]
            };
            restaurant.hours = hours;
          }
        }
      }
      
      return restaurant;
    } catch (error) {
      console.error('Error enriching restaurant data:', error);
      // Don't fail the whole process if enrichment fails
      return restaurant;
    }
  }
  
  /**
   * Get user's saved restaurants with filtering and pagination
   * @param {String} userId - User ID to get restaurants for
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Restaurants and pagination info
   */
  async getUserRestaurants(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        visitStatus,
        cuisine,
        search
      } = options;
      
      // Build query
      const query = { userId };
      
      if (visitStatus) {
        query.visitStatus = visitStatus;
      }
      
      if (cuisine) {
        query.cuisine = cuisine;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { originalMessage: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Execute query with pagination
      const restaurants = await Restaurant.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      // Get total count
      const total = await Restaurant.countDocuments(query);
      
      return {
        restaurants,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching user restaurants:', error);
      throw error;
    }
  }
}

module.exports = new RestaurantService(); 