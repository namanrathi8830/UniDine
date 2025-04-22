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

  // For Business Account (Instagram Graph API)
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement&response_type=code`;
  
  // For Personal Account (Instagram Basic Display API)
  // const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;
  
  res.send(`
    <h1>Instagram Authentication Setup</h1>
    <p>Click the button below to authorize your Instagram business account:</p>
    <a href="${authUrl}" style="display: inline-block; background-color: #E1306C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Connect Instagram Business Account</a>
  `);
});

// Handle the Instagram callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code not received');
  }
  
  try {
    // Exchange code for access token using Facebook endpoint for business accounts
    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }
    });
    
    const { access_token } = response.data;
    
    // Get associated pages (required for Instagram Business API)
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token
      }
    });
    
    // Display the results
    res.send(`
      <h1>Authentication Successful</h1>
      <p>Your Facebook account has been connected.</p>
      <p>Add this token to your .env file as FACEBOOK_ACCESS_TOKEN:</p>
      <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto;">${access_token}</pre>
      
      <h2>Connected Pages</h2>
      <p>Select the Facebook Page connected to your Instagram Business account:</p>
      <ul>
        ${pagesResponse.data.data.map(page => `
          <li>
            <strong>${page.name}</strong>
            <br>Page ID: ${page.id}
            <br>Access Token: <span style="font-size: 10px;">${page.access_token.substring(0, 20)}...</span>
            <br><a href="/get-instagram/${page.id}/${encodeURIComponent(page.access_token)}">Connect this Page's Instagram Account</a>
          </li>
        `).join('')}
      </ul>
    `);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// Get Instagram account connected to a Facebook page
app.get('/get-instagram/:pageId/:pageToken', async (req, res) => {
  const { pageId, pageToken } = req.params;
  
  try {
    // Get Instagram Business Account ID
    const instagramResponse = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: pageToken
      }
    });
    
    if (!instagramResponse.data.instagram_business_account) {
      return res.status(404).send('No Instagram Business Account found connected to this Facebook Page');
    }
    
    const instagramAccountId = instagramResponse.data.instagram_business_account.id;
    
    res.send(`
      <h1>Instagram Business Account Connected</h1>
      <p>Your Instagram Business Account has been found.</p>
      <p>Instagram Business Account ID: ${instagramAccountId}</p>
      <p>Add these values to your .env file:</p>
      <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto;">
FACEBOOK_PAGE_ID=${pageId}
FACEBOOK_PAGE_ACCESS_TOKEN=${pageToken}
INSTAGRAM_BUSINESS_ACCOUNT_ID=${instagramAccountId}
      </pre>
    `);
  } catch (error) {
    console.error('Error getting Instagram account:', error.response?.data || error.message);
    res.status(500).send(`Error finding Instagram account: ${error.message}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Instagram setup server running at http://localhost:${PORT}/auth`);
  console.log('Open the URL above to connect your Instagram account');
}); 