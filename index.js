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
const Restaurant = require('./src/models/Restaurant');
const RestaurantService = require('./src/services/restaurant-service');

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

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook event handler
app.post('/webhook', async (req, res) => {
  console.log('Webhook payload:', JSON.stringify(req.body, null, 2));
  
  // Handle different types of webhook events
  const { object, entry } = req.body;
  
  if (object === 'instagram') {
    for (const e of entry) {
      // Process different types of Instagram webhook events
      if (e.changes) {
        for (const change of e.changes) {
          console.log('Instagram event:', change.field);
          
          // Handle direct messages
          if (change.field === 'messages') {
            try {
              await handleInstagramMessage(change.value);
            } catch (error) {
              console.error('Error handling Instagram message:', error);
            }
          }
          
          // Handle comments
          if (change.field === 'comments') {
            try {
              await handleInstagramComment(change.value);
            } catch (error) {
              console.error('Error handling Instagram comment:', error);
            }
          }

          // Handle mentions
          if (change.field === 'mentions') {
            try {
              await handleInstagramMention(change.value);
            } catch (error) {
              console.error('Error handling Instagram mention:', error);
            }
          }
        }
      }
    }
  }
  
  // Always respond with 200 OK to acknowledge receipt of webhook
  res.sendStatus(200);
});

// Handle Instagram direct messages
async function handleInstagramMessage(messageData) {
  try {
    // Extract the message content and user information
    const { message, sender } = messageData;
    
    if (!message || !message.text || !sender || !sender.id) {
      console.log('Skipping message - missing required data');
      return;
    }
    
    console.log(`Processing message from ${sender.id}: ${message.text}`);
    
    // For testing purposes, create a mock user if none is found
    let user = await findUserByInstagramId(sender.id);
    
    if (!user) {
      console.log(`No user found for Instagram ID: ${sender.id}, creating a mock user for testing`);
      user = {
        _id: 'mock_user_' + sender.id,
        name: 'Mock Test User',
        email: 'mock_' + sender.id + '@example.com',
        instagramId: sender.id
      };
      
      // In a production app, we would:
      // await sendInstagramMessage(sender.id, 
      //   "Thanks for your message! To save restaurant recommendations, please connect your Instagram account to UniDine first. Visit our website to get started."
      // );
      // return;
    }
    
    // Check if this looks like a restaurant recommendation
    if (isRestaurantRecommendation(message.text)) {
      console.log('Message identified as restaurant recommendation');
      try {
        // Process and store the restaurant information using the service
        const restaurant = await RestaurantService.processRecommendation(
          message.text, 
          user._id, 
          sender.id
        );
        
        console.log('Restaurant saved successfully:', {
          name: restaurant.name,
          location: restaurant.location,
          cuisine: restaurant.cuisine
        });
        
        // Send a confirmation message
        await sendInstagramMessage(sender.id, 
          `Thanks for sharing! I've saved "${restaurant.name}" to your UniDine collection. You can view and manage your saved restaurants on the UniDine app.`
        );
      } catch (error) {
        console.error('Error processing restaurant:', error);
      }
    } else {
      console.log('Message is not a restaurant recommendation');
      // This doesn't look like a restaurant recommendation
      await sendInstagramMessage(sender.id, 
        "Thanks for your message! If you'd like to save a restaurant recommendation, please share details about a restaurant you've visited or want to try."
      );
    }
  } catch (error) {
    console.error('Error in handleInstagramMessage:', error);
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

// Find a user by their Instagram ID
async function findUserByInstagramId(instagramUserId) {
  try {
    // Look up user in the database
    const user = await User.findOne({ instagramId: instagramUserId });
    
    if (user) {
      return user;
    }
    
    // If no user found, return null
    console.log(`User not found for Instagram ID: ${instagramUserId}`);
    return null;
  } catch (error) {
    console.error('Error finding user by Instagram ID:', error);
    return null;
  }
}

// Send a message back to the user on Instagram
async function sendInstagramMessage(recipientId, messageText) {
  try {
    console.log(`Sending message to ${recipientId}: ${messageText}`);
    
    // In a production app, you would use the Instagram Graph API to send a message
    // This requires page_messaging permission which requires app review
    // For demonstration purposes, we'll just log the message
    console.log('Message sent successfully');
    
    // When you have the proper permissions, you would use:
    // const instagramClient = new InstagramAPI(process.env.INSTAGRAM_ACCESS_TOKEN);
    // await instagramClient.sendMessage(recipientId, messageText);
    
    return true;
  } catch (error) {
    console.error('Error sending Instagram message:', error);
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