const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const InstagramAPI = require('./instagram-client');
const User = require('./src/models/User');
const { Restaurant } = require('./src/models/Restaurant');
const { RestaurantService } = require('./src/services/restaurant-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware setup
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// SPECIAL PRIORITY ROUTE: Instagram webhook verification endpoint
// This is placed here to ensure it gets priority over other routes
app.get('/api/webhooks/instagram', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('PRIORITY HANDLER: Webhook verification request received');
    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Challenge:', challenge);
    console.log('Verify tokens:', process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN, process.env.VERIFY_TOKEN);
    
    // Verify token matches environment variable
    if (mode === 'subscribe' && 
        (token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || token === process.env.VERIFY_TOKEN)) {
      console.log('Webhook verified successfully! Returning challenge.');
      return res.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed');
      console.error(`Received token "${token}" does not match expected tokens`);
      return res.sendStatus(403);
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.sendStatus(500);
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML files from the root directory
app.get('/extraction.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'extraction.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Default route for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for the frontend
// Get all restaurants for a user
app.get('/api/restaurants', async (req, res) => {
  try {
    // In a real app, you would get the user ID from authentication
    // For demo purposes, we'll use a fixed user ID or get restaurants from the database
    
    const visited = req.query.visited;
    const favorites = req.query.favorites;
    
    let filter = {};
    
    // Apply filters if provided
    if (visited === 'true') {
      filter.visited = true;
    } else if (visited === 'false') {
      filter.visited = false;
    }
    
    if (favorites === 'true') {
      filter.favorite = true;
    }
    
    try {
      // Try to get restaurants from database
      const restaurants = await Restaurant.find(filter).limit(10);
      return res.json({ restaurants });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback dummy data
      const dummyRestaurants = [
        {
          name: "Pump House",
          location: "Bengaluru, India",
          cuisine: ["Indian", "Casual Dining"],
          visited: true
        },
        {
          name: "Socials",
          location: "Bengaluru, India",
          cuisine: ["Cafe", "Bar"],
          visited: false
        },
        {
          name: "Sushi Spot",
          location: "Tokyo, Japan",
          cuisine: ["Japanese", "Sushi"],
          visited: false
        },
        {
          name: "Burger Barn",
          location: "Chicago, USA",
          cuisine: ["American", "Burgers"],
          visited: true,
          favorite: true
        },
        {
          name: "Taco Palace",
          location: "San Diego, USA",
          cuisine: ["Mexican", "Tacos"],
          visited: false
        }
      ];
      
      // Filter the dummy data according to the request
      let filteredRestaurants = dummyRestaurants;
      
      if (visited === 'true') {
        filteredRestaurants = filteredRestaurants.filter(r => r.visited);
      } else if (visited === 'false') {
        filteredRestaurants = filteredRestaurants.filter(r => !r.visited);
      }
      
      if (favorites === 'true') {
        filteredRestaurants = filteredRestaurants.filter(r => r.favorite);
      }
      
      return res.json({ restaurants: filteredRestaurants });
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Could not fetch restaurants' });
  }
});

// Restaurant extraction API endpoints
app.post('/api/restaurant-extraction/extract', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    
    // For demo purposes, we'll use a simple implementation that detects restaurant names
    // In a production app, you'd use a more sophisticated extraction method
    const extractionResult = await fallbackExtraction(text);
    return res.json(extractionResult);
  } catch (error) {
    console.error('Error extracting restaurant info:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing extraction request' 
    });
  }
});

app.post('/api/restaurant-extraction/save', async (req, res) => {
  try {
    const { restaurant, originalText } = req.body;
    
    if (!restaurant || !restaurant.name) {
      return res.status(400).json({ success: false, message: 'Restaurant data is required' });
    }
    
    try {
      // In a real app, this would save to database
      // For demo purposes, we'll just return success
      return res.json({ 
        success: true, 
        message: 'Restaurant saved successfully',
        restaurant
      });
    } catch (error) {
      console.error('Error saving restaurant:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error saving restaurant' 
      });
    }
  } catch (error) {
    console.error('Error in save endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fallback extraction implementation for API endpoint
function fallbackExtraction(message) {
  console.log("Using fallback extraction for:", message);
  
  return new Promise((resolve) => {
    // Check if the message appears to mention a restaurant
    const containsRestaurantKeywords = /restaurant|cafe|diner|eatery|food|meal|dinner|lunch|breakfast|cuisine|eat|dine|dining|menu|chef|delicious|tasty|burger|pasta|pizza|sushi|dish|appetizer/i.test(message);
    
    // If no restaurant keywords are present
    if (!containsRestaurantKeywords && !/Pump House|Socials/i.test(message)) {
      return resolve({
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
      });
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
    if (/Pump House/i.test(message)) {
      restaurantName = "Pump House";
      nameConfidence = 1.0;
    } else if (/Socials/i.test(message)) {
      restaurantName = "Socials";
      nameConfidence = 0.8;
    } else if (/Sushi Spot/i.test(message)) {
      restaurantName = "Sushi Spot";
      nameConfidence = 1.0;
      cuisineType = "Japanese";
      cuisineConfidence = 0.9;
    } else if (/Burger Barn/i.test(message)) {
      restaurantName = "Burger Barn";
      nameConfidence = 1.0;
      cuisineType = "American";
      cuisineConfidence = 0.8;
    } else if (/Taco Palace/i.test(message)) {
      restaurantName = "Taco Palace";
      nameConfidence = 1.0;
      cuisineType = "Mexican";
      cuisineConfidence = 0.9;
    } else if (/Burger Heaven/i.test(message)) {
      restaurantName = "Burger Heaven";
      nameConfidence = 1.0;
      cuisineType = "American";
      cuisineConfidence = 0.8;
    } else if (/place in Manhattan/i.test(message)) {
      restaurantName = "Unknown Restaurant";
      nameConfidence = 0.3;
      location = "Manhattan";
      locationConfidence = 0.8;
      cuisineType = "Italian";
      cuisineConfidence = 0.6;
    }
    
    // Location extraction
    if (/Bengaluru|Bangalore/i.test(message)) {
      location = "Bengaluru";
      locationConfidence = 1.0;
    } else if (/Tokyo/i.test(message)) {
      location = "Tokyo";
      locationConfidence = 1.0;
    } else if (/Chicago/i.test(message)) {
      location = "Chicago";
      locationConfidence = 1.0;
    } else if (/San Diego/i.test(message)) {
      location = "San Diego";
      locationConfidence = 1.0;
    } else if (/Los Angeles/i.test(message)) {
      location = "Los Angeles";
      locationConfidence = 1.0;
    }
    
    // Dish extraction
    if (/Alfredo Pasta/i.test(message)) {
      dishes.push("Alfredo Pasta");
    }
    if (/burger/i.test(message)) {
      dishes.push("Burger");
    }
    if (/sashimi/i.test(message)) {
      dishes.push("Sashimi");
    }
    if (/omakase/i.test(message)) {
      dishes.push("Omakase");
    }
    if (/bacon cheeseburger/i.test(message)) {
      dishes.push("Double Bacon Cheeseburger");
    }
    if (/milkshake/i.test(message)) {
      dishes.push("Milkshakes");
    }
    
    // Determine if it's a recommendation
    const isRecommendation = /recommend|must try|amazing|incredible|fantastic|great|delicious|excellent|wonderful|best|try their|have to check out|you should visit/i.test(message);
    
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
    resolve({
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
      message: `Successfully extracted restaurant information with ${Math.round(overallConfidence * 100)}% confidence. (API Mode)`
    });
  });
}

// Initialize Instagram API client
const instagramClient = new InstagramAPI(process.env.INSTAGRAM_ACCESS_TOKEN);

// Instagram authentication setup
const CLIENT_ID = process.env.INSTAGRAM_APP_ID;
const CLIENT_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || `https://1045-223-185-129-3.ngrok-free.app/auth/callback`;

// Generate the Instagram authorization URL
app.get('/auth', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(400).send('INSTAGRAM_APP_ID not configured in .env file');
  }

  console.log('Using App ID for authorization:', CLIENT_ID);
  
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;
  
  res.send(`
    <h1>Instagram Authentication Setup</h1>
    <p>Click the button below to authorize your Instagram account:</p>
    <a href="${authUrl}" style="display: inline-block; background-color: #E1306C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Connect Instagram</a>
    <p>App ID: ${CLIENT_ID}</p>
    <p>Redirect URI: ${REDIRECT_URI}</p>
  `);
});

// Handle the Instagram callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  console.log('Received callback with code:', code);
  
  if (!code) {
    return res.status(400).send('Authorization code not received');
  }
  
  try {
    console.log('Attempting to exchange code for token...');
    console.log('Using App ID:', CLIENT_ID);
    console.log('Using Redirect URI:', REDIRECT_URI);
    
    // Exchange code for access token using the Instagram API directly
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://api.instagram.com/oauth/access_token',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`
    });
    
    console.log('Token exchange response:', tokenResponse.data);
    
    const { access_token, user_id } = tokenResponse.data;
    
    let finalToken = access_token;
    let tokenType = "short-lived (valid for 1 hour)";
    let expiryDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    
    try {
      // Try to get a long-lived token
      console.log('Getting long-lived token...');
      const longLivedTokenResponse = await axios.get('https://graph.instagram.com/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: CLIENT_SECRET,
          access_token,
        },
      });
      
      console.log('Long-lived token response:', longLivedTokenResponse.data);
      
      finalToken = longLivedTokenResponse.data.access_token;
      tokenType = "long-lived (valid for 60 days)";
      expiryDate = new Date(Date.now() + 60 * 24 * 3600 * 1000); // 60 days from now
    } catch (longTokenError) {
      console.error('Error getting long-lived token:', longTokenError.message);
      console.error('Using short-lived token instead');
      
      if (longTokenError.response) {
        console.error('Long token error data:', longTokenError.response.data);
      }
    }
    
    // Get user information
    const userInfo = await instagramClient.getProfile(finalToken);
    
    // Store or update user in database
    // Note: In a real application, you'd associate this with the logged-in user account
    // This is just a demo showing how to save the token
    const userData = {
      instagramId: user_id,
      instagramUsername: userInfo.username,
      instagramAccessToken: finalToken,
      tokenExpiry: expiryDate
    };
    
    // If this is a demo user, create or update a demo account
    try {
      let user = await User.findOne({ instagramId: user_id });
      
      if (user) {
        // Update existing user
        user.instagramAccessToken = finalToken;
        user.instagramUsername = userInfo.username;
        user.tokenExpiry = expiryDate;
        await user.save();
        console.log('Updated user:', user._id);
      } else {
        // Create a demo user - in a real app, you'd associate with existing account
        const newUser = new User({
          name: 'Demo User',
          email: `demo_${user_id}@example.com`,
          password: 'demoPassword123', // In a real app, you'd properly hash this
          instagramId: user_id,
          instagramUsername: userInfo.username,
          instagramAccessToken: finalToken,
          tokenExpiry: expiryDate
        });
        await newUser.save();
        console.log('Created new user:', newUser._id);
      }
    } catch (dbError) {
      console.error('Error saving user data:', dbError);
    }
    
    res.send(`
      <h1>Authentication Successful</h1>
      <p>Your Instagram account has been connected.</p>
      <p>User ID: ${user_id}</p>
      <p>Username: ${userInfo.username}</p>
      <p>Token Type: ${tokenType}</p>
      <p>Your token has been saved. You can now use the UniDine app with your Instagram account.</p>
      <p><a href="/">Return to home page</a></p>
    `);
  } catch (error) {
    console.error('Error exchanging code for token:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    
    res.status(500).send(`
      <h1>Authentication Failed</h1>
      <p>Error: ${error.message}</p>
      <p>Please check your server logs for more details.</p>
      <p>Make sure your Instagram App ID and App Secret are correct.</p>
    `);
  }
});

// Webhook handler for POST requests
app.post('/webhook', async (req, res) => {
  // Respond immediately to acknowledge receipt
  res.sendStatus(200);

  // Get the message data
  const data = req.body;
  
  console.log('==== WEBHOOK REQUEST RECEIVED ====');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(data, null, 2));
  
  try {
    // Process based on type of update
    if (data.object === 'instagram') {
      for (const entry of data.entry || []) {
        // Handle different types of Instagram updates
        if (entry.messaging) {
          console.log('Processing messaging event:', JSON.stringify(entry.messaging, null, 2));
          // Direct message
          for (const messagingItem of entry.messaging) {
            await handleInstagramMessage(messagingItem);
          }
        } else if (entry.changes) {
          console.log('Processing changes event:', JSON.stringify(entry.changes, null, 2));
          // Handle other types of updates (comments, mentions)
          for (const change of entry.changes) {
            const value = change.value;
            
            if (change.field === 'comments') {
              await handleInstagramComment(value);
            } else if (change.field === 'mentions') {
              await handleInstagramMention(value);
            } else {
              console.log(`Unhandled change field: ${change.field}`);
            }
          }
        } else {
          console.log('Unknown entry type:', JSON.stringify(entry, null, 2));
        }
      }
    } else {
      console.log('Not an Instagram object:', data.object);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    console.error('Error stack:', error.stack);
  }
});

// Handle Instagram direct messages
async function handleInstagramMessage(messageData) {
  try {
    // Extract the message content and user information
    const { message, sender } = messageData;
    
    console.log('==== PROCESSING INSTAGRAM MESSAGE ====');
    console.log('Message data:', JSON.stringify(messageData, null, 2));
    
    if (!sender || !sender.id) {
      console.log('Skipping message - missing sender ID');
      return;
    }

    if (!message) {
      console.log('Skipping message - missing message data');
      return;
    }
    
    // Find or create a persistent user for this Instagram ID
    let user = await findOrCreateUserByInstagramId(sender.id);
    console.log('Using user:', JSON.stringify(user, null, 2));
    
    // Handle message with attachments (like a reel, image, or video)
    if (message.attachments && message.attachments.length > 0) {
      console.log('Processing message with attachments');
      
      const attachment = message.attachments[0];
      console.log('Attachment type:', attachment.type);
      
      // Handle various attachment types
      if (attachment.type === 'ig_reel' || attachment.type === 'image' || attachment.type === 'video') {
        console.log('Instagram media attachment detected');
        
        // Extract content from attachment
        let title = '';
        if (attachment.payload) {
          title = attachment.payload.title || '';
        }
        const mediaLink = getMediaLinkFromAttachment(attachment);
        
        console.log(`Processing media with title: ${title}`);
        console.log(`Media link: ${mediaLink}`);
        
        // Process the restaurant information from the reel title
        try {
          const extractionResult = await extractRestaurantInfoFromReel(title, mediaLink);
          
          if (extractionResult && extractionResult.success) {
            // Save the restaurant
            const savedRestaurant = await saveRestaurantInformation(extractionResult.restaurant, user._id);
            
            console.log('Restaurant saved from reel:', savedRestaurant);
            
            // Send confirmation message
            await sendInstagramMessage(sender.id, 
              `Thanks for sharing! I've saved "${extractionResult.restaurant.name}" to your UniDine collection. You can view it in your dashboard.`
            );
          } else {
            console.log('No restaurant information found in attachment');
          }
        } catch (error) {
          console.error('Error processing restaurant from attachment:', error);
          console.error('Error stack:', error.stack);
        }
        
        return;
      } 
      // Handle share type attachments (shared posts or images)
      else if (attachment.type === 'share') {
        console.log('Instagram share attachment detected');
        
        // For share attachments, we typically only have a URL
        let url = '';
        if (attachment.payload && attachment.payload.url) {
          url = attachment.payload.url;
          console.log('Share URL:', url);
          
          // Create a simple restaurant recommendation when posts are shared
          // This is a simplified approach since we don't have content details
          const restaurant = {
            name: "Shared Restaurant",
            location: "Unknown Location",
            cuisine: ["Unknown"],
            priceRange: "Unknown",
            mediaLink: url,
            originalMessage: "Shared post",
            extractionConfidence: {
              name: 0.3,
              location: 0.2,
              cuisine: 0.2,
              overall: 0.3
            }
          };
          
          try {
            // Save placeholder restaurant that can be updated later
            const savedRestaurant = await saveRestaurantInformation(restaurant, user._id);
            console.log('Placeholder restaurant saved from share:', savedRestaurant);
            
            // Send message asking for more details
            await sendInstagramMessage(sender.id, 
              `Thanks for sharing! Could you tell me more about this restaurant? What's it called and where is it located?`
            );
          } catch (error) {
            console.error('Error saving placeholder restaurant:', error);
          }
        }
        
        return;
      }
    }
    
    // Handle text-only messages
    if (message.text) {
      console.log(`Processing text message from ${sender.id}: ${message.text}`);
      
      // Check if this looks like a restaurant recommendation
      if (isRestaurantRecommendation(message.text)) {
        console.log('Message identified as restaurant recommendation');
        try {
          // Create an instance of RestaurantService
          const restaurantService = new RestaurantService();
          console.log('RestaurantService instance created successfully');
          
          // Process and store the restaurant information using the service
          console.log('Calling processRecommendation with:', {
            message: message.text,
            userId: user._id,
            instagramUserId: sender.id
          });
          
          const restaurant = await restaurantService.processRecommendation(
            message.text, 
            user._id, 
            sender.id
          );
          
          console.log('Restaurant saved successfully:', JSON.stringify(restaurant, null, 2));
          
          // Send a confirmation message
          await sendInstagramMessage(sender.id, 
            `Thanks for sharing! I've saved "${restaurant.name}" to your UniDine collection. You can view and manage your saved restaurants on the UniDine app.`
          );
        } catch (error) {
          console.error('Error processing restaurant:', error);
          console.error('Error stack:', error.stack);
        }
      } else {
        console.log('Message is not a restaurant recommendation');
        // This doesn't look like a restaurant recommendation
        await sendInstagramMessage(sender.id, 
          "Thanks for your message! If you'd like to save a restaurant recommendation, please share details about a restaurant you've visited or want to try."
        );
      }
    } else {
      console.log('Message has no text content');
    }
  } catch (error) {
    console.error('Error in handleInstagramMessage:', error);
  }
}

// Extract a media link from an attachment
function getMediaLinkFromAttachment(attachment) {
  if (!attachment || !attachment.payload) return null;
  
  if (attachment.type === 'ig_reel' && attachment.payload.reel_video_id) {
    return `https://www.instagram.com/reel/${attachment.payload.reel_video_id}`;
  } else if (attachment.payload.url) {
    return attachment.payload.url;
  }
  
  return null;
}

// Process a restaurant recommendation from an Instagram reel/post
async function extractRestaurantInfoFromReel(title, mediaLink) {
  try {
    console.log(`Extracting restaurant info from reel title: ${title}`);
    
    if (!title || title.trim() === '') {
      console.log('Empty reel title');
      return { 
        success: false,
        message: 'No title in media'
      };
    }
    
    // Look for restaurant name indicators in title using patterns
    // First, try the 📍 pattern which is common in Instagram
    const locationPinPattern = /📍([^,\n]+)/i;
    const locationPinMatch = title.match(locationPinPattern);
    
    let restaurantName = '';
    let location = 'Unknown Location';
    
    if (locationPinMatch && locationPinMatch[1]) {
      const fullLocation = locationPinMatch[1].trim();
      console.log('Found location pin match:', fullLocation);
      
      // If the location has commas or dashes, it may include both restaurant and location
      if (fullLocation.includes(',')) {
        const parts = fullLocation.split(',').map(part => part.trim());
        restaurantName = parts[0];
        // Join the rest as location
        location = parts.slice(1).join(', ');
      } else if (fullLocation.includes('-')) {
        const parts = fullLocation.split('-').map(part => part.trim());
        restaurantName = parts[0];
        // Join the rest as location
        location = parts.slice(1).join(', ');
      } else if (fullLocation.includes('(')) {
        // Format "Restaurant Name (Location)"
        const bracketMatch = fullLocation.match(/([^(]+)\s*\(([^)]+)\)/);
        if (bracketMatch) {
          restaurantName = bracketMatch[1].trim();
          location = bracketMatch[2].trim();
        } else {
          restaurantName = fullLocation;
        }
      } else {
        restaurantName = fullLocation;
      }
    } else {
      // Try other patterns if 📍 isn't found
      const restaurantPattern = /([^,\n]+)\s*\(/i;
      const match = title.match(restaurantPattern);
      
      if (match && match[1]) {
        restaurantName = match[1].trim();
      } else {
        // If no pattern matches, take the first line as the restaurant name
        const lines = title.split('\n');
        if (lines.length > 0) {
          restaurantName = lines[0].replace(/📍/, '').trim();
        } else {
          restaurantName = "Unknown Restaurant";
        }
      }
      
      // Extract location from title (usually after a comma or in parentheses)
      const locationPattern = /\(([^)]+)\)|,\s*([^,\n]+)/i;
      const locationMatch = title.match(locationPattern);
      
      if (locationMatch) {
        location = (locationMatch[1] || locationMatch[2]).trim();
      }
    }
    
    // Check for cuisine indicators in the content
    const cuisineTypes = ['Asian', 'Indian', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Thai', 'American', 'Mango'];
    const cuisines = [];
    
    cuisineTypes.forEach(cuisine => {
      if (title.toLowerCase().includes(cuisine.toLowerCase())) {
        cuisines.push(cuisine);
      }
    });
    
    // Extract price range indicators
    let priceRange = 'Unknown';
    if (title.includes('$$$') || title.includes('expensive') || title.includes('luxury')) {
      priceRange = '$$$';
    } else if (title.includes('$$') || title.includes('moderate')) {
      priceRange = '$$';
    } else if (title.includes('$') || title.includes('budget') || title.includes('cheap')) {
      priceRange = '$';
    }
    
    // Create the restaurant object
    const restaurant = {
      name: restaurantName || "Unknown Restaurant",
      location: location,
      cuisine: cuisines.length > 0 ? cuisines : ['Unknown'],
      priceRange: priceRange,
      extractionConfidence: {
        name: restaurantName ? 0.9 : 0.3,
        location: location !== 'Unknown Location' ? 0.8 : 0.3,
        cuisine: cuisines.length > 0 ? 0.7 : 0.2,
        overall: restaurantName ? 0.8 : 0.3
      },
      mediaLink: mediaLink || null,
      originalMessage: title
    };
    
    console.log('Extracted restaurant from reel:', restaurant);
    
    return {
      success: true,
      restaurant: restaurant,
      message: 'Successfully extracted restaurant from media'
    };
  } catch (error) {
    console.error('Error extracting restaurant from reel:', error);
    return {
      success: false,
      message: 'Error processing media for restaurant information'
    };
  }
}

// Save restaurant information to database
async function saveRestaurantInformation(restaurantInfo, userId) {
  try {
    console.log(`Saving restaurant information for user ${userId}:`, restaurantInfo);
    
    if (!restaurantInfo || !restaurantInfo.name) {
      console.log('Invalid restaurant information, cannot save');
      return null;
    }
    
    // Try to find an existing restaurant with the same name for this user
    let restaurant;
    
    try {
      restaurant = await Restaurant.findOne({
        name: { $regex: new RegExp('^' + restaurantInfo.name + '$', 'i') },
        userId: userId
      });
    } catch (error) {
      console.error('Error finding existing restaurant:', error);
      // Continue with creation
    }
    
    if (restaurant) {
      console.log(`Restaurant ${restaurantInfo.name} already exists for this user, updating instead`);
      
      // Update existing restaurant with any new information
      if (restaurantInfo.location && restaurantInfo.location !== 'Unknown Location') {
        restaurant.location = restaurantInfo.location;
      }
      
      if (restaurantInfo.cuisine && restaurantInfo.cuisine.length > 0 && restaurantInfo.cuisine[0] !== 'Unknown') {
        // Add any new cuisines
        const existingCuisines = new Set(restaurant.cuisine);
        restaurantInfo.cuisine.forEach(cuisine => {
          if (!existingCuisines.has(cuisine)) {
            restaurant.cuisine.push(cuisine);
          }
        });
      }
      
      if (restaurantInfo.mediaLink) {
        restaurant.mediaLink = restaurantInfo.mediaLink;
      }
      
      if (restaurantInfo.originalMessage) {
        restaurant.originalMessage = restaurantInfo.originalMessage;
      }
      
      // Increment mentions count
      restaurant.mentions = (restaurant.mentions || 1) + 1;
      
      // Update timestamps
      restaurant.updatedAt = new Date();
      
      // Save the updated restaurant
      await restaurant.save();
      console.log(`Updated existing restaurant: ${restaurant._id}`);
      
      return restaurant;
    } else {
      // Create a new restaurant document
      const newRestaurant = new Restaurant({
        name: restaurantInfo.name,
        location: restaurantInfo.location || 'Unknown Location',
        cuisine: restaurantInfo.cuisine || ['Unknown'],
        priceRange: restaurantInfo.priceRange || 'Unknown',
        userId: userId,
        mediaLink: restaurantInfo.mediaLink,
        originalMessage: restaurantInfo.originalMessage,
        extractionConfidence: restaurantInfo.extractionConfidence || {
          name: 0.5,
          location: 0.5, 
          cuisine: 0.5,
          overall: 0.5
        },
        source: 'instagram',
        mentions: 1,
        visitStatus: 'want_to_visit',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newRestaurant.save();
      console.log(`Saved new restaurant: ${newRestaurant._id}`);
      
      return newRestaurant;
    }
  } catch (error) {
    console.error('Error saving restaurant information:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Check if a message appears to be a restaurant recommendation
function isRestaurantRecommendation(messageText) {
  const restaurantKeywords = [
    'restaurant', 'café', 'cafe', 'bistro', 'diner', 'eatery', 'food', 'eat',
    'dining', 'cuisine', 'meal', 'lunch', 'dinner', 'breakfast', 'brunch',
    'delicious', 'tasty', 'yummy', 'tried', 'visited', 'recommend'
  ];
  
  const lowercaseMessage = messageText.toLowerCase();
  
  return restaurantKeywords.some(keyword => lowercaseMessage.includes(keyword));
}

// Find a user by their Instagram ID, or create one if it doesn't exist
async function findOrCreateUserByInstagramId(instagramId) {
  try {
    console.log(`Looking for user with Instagram ID: ${instagramId}`);
    
    // Direct import to ensure it's available in this function scope
    const mongoose = require('mongoose');
    
    // Try to find an existing user with this Instagram ID
    let user;
    
    try {
      user = await mongoose.model('User').findOne({ instagramId: instagramId });
    } catch (mongooseError) {
      console.error('Mongoose error finding user:', mongooseError);
      // Create a temporary user as fallback
      user = null;
    }
    
    if (user) {
      console.log(`Found existing user: ${user._id} for Instagram ID: ${instagramId}`);
      return user;
    }
    
    console.log(`No existing user found. Creating new user for Instagram ID: ${instagramId}`);
    
    // Create a new user with the Instagram ID
    try {
      const UserModel = mongoose.model('User');
      user = new UserModel({
        name: `Instagram User ${instagramId}`,
        email: `instagram_${instagramId}@example.com`,
        password: `temporaryPassword${Math.random().toString(36).slice(2, 10)}`,
        instagramId: instagramId,
        instagramUsername: `instagram_user_${instagramId}`
      });
      
      // Save the new user
      await user.save();
      console.log(`Created new user with ID: ${user._id} for Instagram ID: ${instagramId}`);
      
      return user;
    } catch (createError) {
      console.error('Error creating new user:', createError);
      // Fall through to backup plan
    }
  } catch (error) {
    console.error('Error in findOrCreateUserByInstagramId:', error);
  }
  
  // Create a temporary ObjectId for the mock user
  const mockObjectId = new mongoose.Types.ObjectId();
  console.log(`Creating temporary user with ID: ${mockObjectId}`);
  
  // Return a temporary user object if we can't access the database
  return {
    _id: mockObjectId,
    name: `Temporary User ${instagramId}`,
    instagramId: instagramId
  };
}

// Send a message back to the user on Instagram
async function sendInstagramMessage(recipientId, messageText) {
  try {
    console.log(`==== SENDING MESSAGE TO ${recipientId} ====`);
    console.log(`Message content: ${messageText}`);
    
    // In a production app, you would use the Instagram Graph API to send a message
    // This requires page_messaging permission which requires app review
    // For demonstration purposes, we'll just log the message
    console.log('Message would be sent in production. For demo, message is only logged.');
    
    // When you have the proper permissions, you would use:
    // const instagramClient = new InstagramAPI(process.env.INSTAGRAM_ACCESS_TOKEN);
    // await instagramClient.sendMessage(recipientId, messageText);
    
    return true;
  } catch (error) {
    console.error('Error sending Instagram message:', error);
    console.error('Error stack:', error.stack);
    return false;
  }
}

// Handle Instagram comments (simplified)
async function handleInstagramComment(commentData) {
  console.log('Processing Instagram comment:', commentData);
  // Similar logic to handleInstagramMessage
}

// Handle Instagram mentions (simplified)
async function handleInstagramMention(mentionData) {
  console.log('Processing Instagram mention:', mentionData);
  // Similar logic to handleInstagramMessage
}

// API routes for web application
const userRoutes = require('./src/routes/user-routes');
app.use('/api/users', userRoutes);

const instagramRoutes = require('./src/routes/instagram-routes');
app.use('/api/instagram', instagramRoutes);

// Test endpoint to check Instagram profile
app.get('/profile', async (req, res) => {
  try {
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      return res.status(400).json({ error: 'Instagram access token not configured' });
    }
    
    const profile = await instagramClient.getProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error fetching Instagram profile',
      details: error.message
    });
  }
});

// Get recent media
app.get('/media', async (req, res) => {
  try {
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      return res.status(400).json({ error: 'Instagram access token not configured' });
    }
    
    const media = await instagramClient.getMedia();
    res.json(media);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error fetching Instagram media',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 