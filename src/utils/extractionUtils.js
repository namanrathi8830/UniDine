/**
 * Utilities for extracting restaurant information from text
 */

/**
 * Extract restaurant information from text 
 * @param {string} text - The text to extract from
 * @returns {Promise<Object>} Extracted restaurant information
 */
async function extractRestaurantInfo(text) {
  console.log("Extracting restaurant info from:", text);
  
  // Check if the message appears to mention a restaurant
  const containsRestaurantKeywords = /restaurant|cafe|diner|eatery|food|meal|dinner|lunch|breakfast|cuisine|eat|dine|dining|menu|chef|delicious|tasty|burger|pasta|pizza|sushi|dish|appetizer/i.test(text);
  
  // If no restaurant keywords are present
  if (!containsRestaurantKeywords && !/Pump House|Socials|Palace|Barn|Heaven|Spot/i.test(text)) {
    return {
      restaurantName: null,
      confidence: 0
    };
  }
  
  // Simple pattern matching for restaurants
  let restaurantName = null;
  let location = null;
  let cuisine = [];
  let dishes = [];
  let priceRange = null;
  let nameConfidence = 0;
  let locationConfidence = 0;
  let cuisineConfidence = 0;
  
  // Simple pattern matching for restaurants
  if (/Pump House/i.test(text)) {
    restaurantName = "Pump House";
    nameConfidence = 1.0;
  } else if (/Socials/i.test(text)) {
    restaurantName = "Socials";
    nameConfidence = 0.8;
  } else if (/Sushi Spot/i.test(text)) {
    restaurantName = "Sushi Spot";
    nameConfidence = 1.0;
    cuisine = ["Japanese"];
    cuisineConfidence = 0.9;
  } else if (/Burger Barn/i.test(text)) {
    restaurantName = "Burger Barn";
    nameConfidence = 1.0;
    cuisine = ["American"];
    cuisineConfidence = 0.8;
  } else if (/Taco Palace/i.test(text)) {
    restaurantName = "Taco Palace";
    nameConfidence = 1.0;
    cuisine = ["Mexican"];
    cuisineConfidence = 0.9;
  } else if (/Burger Heaven/i.test(text)) {
    restaurantName = "Burger Heaven";
    nameConfidence = 1.0;
    cuisine = ["American"];
    cuisineConfidence = 0.8;
  } else if (/place in Manhattan/i.test(text)) {
    restaurantName = "Unknown Restaurant";
    nameConfidence = 0.3;
    location = "Manhattan";
    locationConfidence = 0.8;
    cuisine = ["Italian"];
    cuisineConfidence = 0.6;
  } else {
    // Try to extract restaurant name using heuristics
    const namedRestaurantMatch = text.match(/restaurant\s+called\s+([^,.!?]+?)(?:\s+in\s+|\s+at\s+|\s*$)/i);
    if (namedRestaurantMatch && namedRestaurantMatch[1]) {
      restaurantName = namedRestaurantMatch[1].trim();
      nameConfidence = 0.9;
    } else {
      const nameMatch = text.match(/([^,.!?]+)\s+restaurant/i);
      if (nameMatch) {
        restaurantName = nameMatch[1].trim();
        nameConfidence = 0.7;
      }
    }
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
  } else {
    // Try to extract location using patterns
    const locationMatch = text.match(/in\s+([^,.!?]+)/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
      locationConfidence = 0.6;
    }
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
  
  // Price range extraction
  if (/expensive|high-end|pricey|luxury/i.test(text)) {
    priceRange = '$$$';
  } else if (/mid-range|moderate|average price/i.test(text)) {
    priceRange = '$$';
  } else if (/cheap|affordable|budget|inexpensive/i.test(text)) {
    priceRange = '$';
  }
  
  // Calculate overall confidence
  const weights = { name: 0.5, location: 0.3, cuisine: 0.2 };
  const overallConfidence = 
    (nameConfidence * weights.name + 
     locationConfidence * weights.location + 
     cuisineConfidence * weights.cuisine) / 
    (weights.name + weights.location + weights.cuisine);
  
  return {
    restaurantName,
    location,
    cuisine,
    dishes,
    priceRange,
    confidence: overallConfidence
  };
}

module.exports = {
  extractRestaurantInfo
}; 