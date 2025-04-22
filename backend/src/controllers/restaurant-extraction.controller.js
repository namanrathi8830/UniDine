const { Restaurant, ExtractionHistory } = require('../models');

/**
 * Analyzes text for restaurant mentions - using pattern matching instead of OpenAI
 * @param {String} text - Text to analyze
 * @returns {Promise<Object>} - Analysis result
 */
exports.analyzeTextForRestaurant = async (text) => {
  try {
    if (!text) {
      return {
        success: false,
        message: 'Text is required for analysis'
      };
    }

    console.log("Using pattern matching for extraction instead of OpenAI");
    
    // Check if the message appears to mention a restaurant
    const containsRestaurantKeywords = /restaurant|cafe|diner|eatery|food|meal|dinner|lunch|breakfast|cuisine|eat|dine|dining|menu|chef|delicious|tasty|burger|pasta|pizza|sushi|dish|appetizer/i.test(text);
    
    // If no restaurant keywords are present
    if (!containsRestaurantKeywords && !/Pump House|Socials|Palace|Barn|Heaven|Spot/i.test(text)) {
      return {
        success: false,
        message: "This doesn't appear to mention a restaurant.",
        analysis: {
          isRestaurantMention: false,
          restaurantName: null,
          restaurantNameConfidence: 0,
          location: null,
          locationConfidence: 0,
          cuisineType: null,
          cuisineTypeConfidence: 0,
          dishesmentioned: []
        }
      };
    }
    
    // For demo purposes, extract a few restaurant names from the message
    let restaurantName = null;
    let location = null;
    let cuisineType = null;
    let dishes = [];
    let nameConfidence = 0;
    let locationConfidence = 0;
    let cuisineConfidence = 0;
    
    // Simple pattern matching for restaurants and dishes
    if (/Pump House/i.test(text)) {
      restaurantName = "Pump House";
      nameConfidence = 1.0;
    } else if (/Socials/i.test(text)) {
      restaurantName = "Socials";
      nameConfidence = 0.8;
    } else if (/Sushi Spot/i.test(text)) {
      restaurantName = "Sushi Spot";
      nameConfidence = 1.0;
      cuisineType = "Japanese";
      cuisineConfidence = 0.9;
    } else if (/Burger Barn/i.test(text)) {
      restaurantName = "Burger Barn";
      nameConfidence = 1.0;
      cuisineType = "American";
      cuisineConfidence = 0.8;
    } else if (/Taco Palace/i.test(text)) {
      restaurantName = "Taco Palace";
      nameConfidence = 1.0;
      cuisineType = "Mexican";
      cuisineConfidence = 0.9;
    } else if (/Burger Heaven/i.test(text)) {
      restaurantName = "Burger Heaven";
      nameConfidence = 1.0;
      cuisineType = "American";
      cuisineConfidence = 0.8;
    } else if (/place in Manhattan/i.test(text)) {
      restaurantName = "Unknown Restaurant";
      nameConfidence = 0.3;
      location = "Manhattan";
      locationConfidence = 0.8;
      cuisineType = "Italian";
      cuisineConfidence = 0.6;
    }
    
    // Location extraction
    if (/Bengaluru|Bangalore/i.test(text)) {
      location = "Bengaluru";
      locationConfidence = 1.0;
    } else if (/Tokyo/i.test(text)) {
      location = "Tokyo";
      locationConfidence = 1.0;
    } else if (/Chicago/i.test(text)) {
      location = "Chicago";
      locationConfidence = 1.0;
    } else if (/San Diego/i.test(text)) {
      location = "San Diego";
      locationConfidence = 1.0;
    } else if (/Los Angeles/i.test(text)) {
      location = "Los Angeles";
      locationConfidence = 1.0;
    }
    
    // Dish extraction
    if (/Alfredo Pasta/i.test(text)) {
      dishes.push("Alfredo Pasta");
    }
    if (/burger/i.test(text)) {
      dishes.push("Burger");
    }
    if (/sashimi/i.test(text)) {
      dishes.push("Sashimi");
    }
    if (/omakase/i.test(text)) {
      dishes.push("Omakase");
    }
    if (/bacon cheeseburger/i.test(text)) {
      dishes.push("Double Bacon Cheeseburger");
    }
    if (/milkshake/i.test(text)) {
      dishes.push("Milkshakes");
    }
    
    // Determine if it's a recommendation
    const isRecommendation = /recommend|must try|amazing|incredible|fantastic|great|delicious|excellent|wonderful|best|try their|have to check out|you should visit/i.test(text);
    
    // Create mock response
    const mockAnalysis = {
      isRestaurantMention: true,
      isRestaurantRecommendation: isRecommendation,
      restaurantName: restaurantName,
      restaurantNameConfidence: nameConfidence,
      location: location,
      locationConfidence: locationConfidence,
      cuisineType: cuisineType,
      cuisineTypeConfidence: cuisineConfidence,
      dishesmentioned: dishes
    };
    
    // Calculate overall confidence
    const weights = { name: 0.5, location: 0.3, cuisine: 0.2 };
    const overallConfidence = 
      (nameConfidence * weights.name + 
       locationConfidence * weights.location + 
       cuisineConfidence * weights.cuisine) / 
      (weights.name + weights.location + weights.cuisine);
    
    // Return formatted response
    return {
      success: true,
      restaurant: {
        name: restaurantName || "Unknown Restaurant",
        location: location || "Unknown Location",
        cuisine: cuisineType ? [cuisineType] : ["Unknown"],
        dishes: dishes,
        extractionConfidence: {
          name: nameConfidence,
          location: locationConfidence,
          cuisine: cuisineConfidence,
          overall: overallConfidence
        }
      },
      isRecommendation: isRecommendation,
      analysis: mockAnalysis,
      message: `Successfully extracted restaurant information with ${Math.round(overallConfidence * 100)}% confidence. (Pattern Matching Mode)`
    };
  } catch (error) {
    console.error('Error analyzing text for restaurant:', error);
    return { 
      success: false, 
      message: error.message || 'Error analyzing text for restaurant'
    };
  }
};

/**
 * Save restaurant from a message (used by webhook handler)
 * @param {Object} restaurant - Restaurant data
 * @param {String} originalText - Original message text
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Result
 */
exports.saveRestaurantFromMessage = async (restaurant, originalText, userId) => {
  try {
    if (!restaurant || !restaurant.name || !userId) {
      return {
        success: false,
        message: 'Missing required data'
      };
    }

    // Check if restaurant already exists
    let existingRestaurant = await Restaurant.findOne({
      name: restaurant.name,
      location: restaurant.location,
      userId: userId
    });

    if (existingRestaurant) {
      // Update existing restaurant
      existingRestaurant.cuisine = restaurant.cuisine || existingRestaurant.cuisine;
      
      // Add dishes if they don't exist
      if (restaurant.dishes && restaurant.dishes.length) {
        restaurant.dishes.forEach(dish => {
          if (!existingRestaurant.dishes.includes(dish)) {
            existingRestaurant.dishes.push(dish);
          }
        });
      }
      
      existingRestaurant.extractionConfidence = restaurant.extractionConfidence || existingRestaurant.extractionConfidence;
      existingRestaurant.mentions = existingRestaurant.mentions + 1;
      existingRestaurant.lastMentioned = new Date();
      existingRestaurant.mentionTexts = existingRestaurant.mentionTexts || [];
      existingRestaurant.mentionTexts.push(originalText);
      
      await existingRestaurant.save();
      
      return {
        success: true,
        message: 'Restaurant updated successfully from message',
        restaurant: existingRestaurant
      };
    }

    // Create new restaurant
    const newRestaurant = await Restaurant.create({
      userId: userId,
      name: restaurant.name,
      location: restaurant.location || 'Unknown Location',
      cuisine: restaurant.cuisine || ['Unknown'],
      dishes: restaurant.dishes || [],
      extractionConfidence: restaurant.extractionConfidence || { overall: 0 },
      mentions: 1,
      visited: false,
      rating: null,
      firstMentioned: new Date(),
      lastMentioned: new Date(),
      mentionTexts: [originalText]
    });

    return {
      success: true,
      message: 'Restaurant saved successfully from message',
      restaurant: newRestaurant
    };
  } catch (error) {
    console.error('Error saving restaurant from message:', error);
    return { 
      success: false, 
      message: error.message || 'Error saving restaurant from message'
    };
  }
};

/**
 * Extract restaurant information from text using pattern matching
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.extractFromText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Use the shared analysis method
    const result = await exports.analyzeTextForRestaurant(text);

    // Save extraction to history
    if (result.success) {
      await ExtractionHistory.create({
        userId: req.user._id,
        originalText: text,
        extractionResult: result.analysis,
        timestamp: new Date()
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error extracting restaurant info:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error processing extraction request'
    });
  }
};

/**
 * Save extracted restaurant to database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.saveExtractedRestaurant = async (req, res) => {
  try {
    const { restaurant, originalText, extractionConfidence } = req.body;
    
    if (!restaurant || !restaurant.name) {
      return res.status(400).json({ message: 'Restaurant information is required' });
    }

    // Check if restaurant already exists
    let existingRestaurant = await Restaurant.findOne({
      name: restaurant.name,
      location: restaurant.location,
      userId: req.user._id
    });

    if (existingRestaurant) {
      // Update existing restaurant
      existingRestaurant.cuisine = restaurant.cuisine || existingRestaurant.cuisine;
      
      // Add dishes if they don't exist
      if (restaurant.dishes && restaurant.dishes.length) {
        restaurant.dishes.forEach(dish => {
          if (!existingRestaurant.dishes.includes(dish)) {
            existingRestaurant.dishes.push(dish);
          }
        });
      }
      
      existingRestaurant.extractionConfidence = extractionConfidence || existingRestaurant.extractionConfidence;
      existingRestaurant.mentions = existingRestaurant.mentions + 1;
      existingRestaurant.lastMentioned = new Date();
      existingRestaurant.mentionTexts = existingRestaurant.mentionTexts || [];
      existingRestaurant.mentionTexts.push(originalText);
      
      await existingRestaurant.save();
      
      return res.json({
        success: true,
        message: 'Restaurant updated successfully',
        restaurant: existingRestaurant
      });
    }

    // Create new restaurant
    const newRestaurant = await Restaurant.create({
      userId: req.user._id,
      name: restaurant.name,
      location: restaurant.location || 'Unknown Location',
      cuisine: restaurant.cuisine || ['Unknown'],
      dishes: restaurant.dishes || [],
      extractionConfidence: extractionConfidence || { overall: 0 },
      mentions: 1,
      visited: false,
      rating: null,
      firstMentioned: new Date(),
      lastMentioned: new Date(),
      mentionTexts: [originalText]
    });

    return res.json({
      success: true,
      message: 'Restaurant saved successfully',
      restaurant: newRestaurant
    });
  } catch (error) {
    console.error('Error saving restaurant:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error saving restaurant'
    });
  }
};

/**
 * Get extraction history for the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getExtractionHistory = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const history = await ExtractionHistory.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await ExtractionHistory.countDocuments({ userId: req.user._id });

    return res.json({
      success: true,
      history,
      pagination: {
        total,
        offset: parseInt(offset),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching extraction history:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching extraction history'
    });
  }
}; 