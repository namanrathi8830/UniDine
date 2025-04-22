const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Get these values from the Facebook/Instagram Developer Dashboard
const CLIENT_ID = process.env.INSTAGRAM_APP_ID;
const CLIENT_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = `https://unidine.vercel.app/auth/callback`;

// Generate the Instagram authorization URL
app.get('/auth', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(400).send('INSTAGRAM_APP_ID not configured in .env file');
  }

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;
  
  res.send(`
    <h1>Instagram Authentication Setup</h1>
    <p>Click the button below to authorize your Instagram account:</p>
    <a href="${authUrl}" style="display: inline-block; background-color: #E1306C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Connect Instagram</a>
  `);
});

// Handle the Instagram callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code not received');
  }
  
  try {
    // Exchange code for access token
    const response = await axios.post('https://api.instagram.com/oauth/access_token', null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token, user_id } = response.data;
    
    // Get the long-lived token (60 days)
    const longLivedTokenResponse = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: CLIENT_SECRET,
        access_token,
      },
    });
    
    const longLivedToken = longLivedTokenResponse.data.access_token;
    
    res.send(`
      <h1>Authentication Successful</h1>
      <p>Your Instagram account has been connected.</p>
      <p>User ID: ${user_id}</p>
      <p>Add this token to your .env file as INSTAGRAM_ACCESS_TOKEN:</p>
      <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto;">${longLivedToken}</pre>
    `);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Instagram setup server running at http://localhost:${PORT}/auth`);
  console.log('Open the URL above to connect your Instagram account');
}); 