const axios = require('axios');

class InstagramClient {
  constructor(accessToken = null) {
    this.accessToken = accessToken;
    this.apiBaseUrl = 'https://graph.instagram.com';
    this.oauthBaseUrl = 'https://api.instagram.com/oauth';
    this.apiVersion = 'v18.0';
  }

  /**
   * Get authorization URL for Instagram OAuth flow
   * @param {String} state - State parameter for CSRF protection
   * @returns {String} Authorization URL
   */
  getAuthorizationUrl(state = '') {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      throw new Error('Missing Instagram configuration. Check INSTAGRAM_APP_ID and INSTAGRAM_REDIRECT_URI in env.');
    }
    
    const url = new URL(`${this.oauthBaseUrl}/authorize`);
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('scope', 'user_profile,user_media');
    url.searchParams.append('response_type', 'code');
    
    if (state) {
      url.searchParams.append('state', state);
    }
    
    return url.toString();
  }

  /**
   * Exchange authorization code for access token
   * @param {String} code - Authorization code from callback
   * @returns {Object} Token data including access_token and expires_in
   */
  async exchangeCodeForToken(code) {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const clientSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!code || !clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required parameters for token exchange');
    }
    
    try {
      // Exchange code for short-lived access token
      const tokenResponse = await axios({
        method: 'post',
        url: `${this.oauthBaseUrl}/access_token`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
      });
      
      const { access_token, user_id } = tokenResponse.data;
      
      // Exchange short-lived token for long-lived token
      const longLivedTokenResponse = await axios.get(`${this.apiBaseUrl}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token,
        }
      });
      
      return {
        ...longLivedTokenResponse.data,
        user_id
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Refresh a long-lived access token
   * @param {String} token - Long-lived access token to refresh
   * @returns {Object} New token data
   */
  async refreshLongLivedToken(token) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: token || this.accessToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error.message);
      throw error;
    }
  }

  /**
   * Get user profile information
   * @param {String} token - Access token (optional, uses instance token if not provided)
   * @returns {Object} User profile data
   */
  async getProfile(token = null) {
    const accessToken = token || this.accessToken;
    
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${this.apiVersion}/me`, {
        params: {
          fields: 'id,username',
          access_token: accessToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      throw error;
    }
  }

  /**
   * Get user's media
   * @param {Number} limit - Number of media items to fetch
   * @param {String} token - Access token (optional)
   * @returns {Object} Media data
   */
  async getMedia(limit = 10, token = null) {
    const accessToken = token || this.accessToken;
    
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${this.apiVersion}/me/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
          limit,
          access_token: accessToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error.message);
      throw error;
    }
  }

  /**
   * Send a message to a user
   * This requires additional permissions and app review
   * @param {String} recipientId - Instagram user ID to send message to
   * @param {String} message - Message text
   * @returns {Object} API response
   */
  async sendMessage(recipientId, message) {
    // Note: This requires 'instagram_manage_messages' permission which requires app review
    try {
      // This is a placeholder - actual implementation requires approved permissions
      console.log(`Would send message to ${recipientId}: ${message}`);
      
      // When permissions are approved, implementation would look like:
      /*
      const response = await axios.post(`https://graph.facebook.com/${this.apiVersion}/me/messages`, {
        recipient: { id: recipientId },
        message: { text: message }
      }, {
        params: { access_token: this.accessToken }
      });
      
      return response.data;
      */
      
      return { success: true, message: 'Message would be sent (placeholder)' };
    } catch (error) {
      console.error('Error sending message:', error.message);
      throw error;
    }
  }
}

module.exports = InstagramClient; 