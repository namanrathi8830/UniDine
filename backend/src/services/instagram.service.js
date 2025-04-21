const axios = require('axios');

/**
 * Instagram Graph API Service
 * Handles all Instagram API interactions
 */
class InstagramService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Exchange short-lived token for long-lived token
   * @param {String} shortLivedToken - Short-lived access token
   * @returns {Promise<Object>} - Response with long-lived token
   */
  async exchangeToken(shortLivedToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.INSTAGRAM_APP_ID,
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          fb_exchange_token: shortLivedToken
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exchanging token:', error.response?.data || error.message);
      throw new Error('Failed to exchange token');
    }
  }

  /**
   * Get Instagram business account info
   * @param {String} accessToken - Instagram access token
   * @returns {Promise<Object>} - Business account info
   */
  async getBusinessAccount(accessToken) {
    try {
      // First get user pages (Facebook Pages)
      const pagesResponse = await axios.get(`${this.baseUrl}/me/accounts`, {
        params: { access_token: accessToken }
      });
      
      const pages = pagesResponse.data.data;
      if (!pages || pages.length === 0) {
        throw new Error('No Facebook Pages found');
      }
      
      // For each page, find Instagram business account
      for (const page of pages) {
        const pageId = page.id;
        const pageAccessToken = page.access_token;
        
        try {
          const igAccountResponse = await axios.get(
            `${this.baseUrl}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
          );
          
          const igBusinessAccount = igAccountResponse.data.instagram_business_account;
          
          if (igBusinessAccount) {
            // Get Instagram business account details
            const accountDetails = await this.getAccountDetails(
              igBusinessAccount.id, 
              pageAccessToken
            );
            
            return {
              ...accountDetails,
              pageId,
              pageAccessToken
            };
          }
        } catch (pageError) {
          console.error(`Error checking page ${pageId}:`, pageError.response?.data || pageError.message);
          // Continue to next page
        }
      }
      
      throw new Error('No Instagram Business Account found');
    } catch (error) {
      console.error('Error getting business account:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram business account');
    }
  }

  /**
   * Get Instagram business account details
   * @param {String} igBusinessId - Instagram business account ID
   * @param {String} accessToken - Access token
   * @returns {Promise<Object>} - Account details
   */
  async getAccountDetails(igBusinessId, accessToken) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${igBusinessId}`,
        {
          params: {
            fields: 'name,username,profile_picture_url,followers_count,media_count',
            access_token: accessToken
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting account details:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram account details');
    }
  }

  /**
   * Get recent media for an Instagram business account
   * @param {String} igBusinessId - Instagram business account ID
   * @param {String} accessToken - Access token
   * @param {Number} limit - Number of media items to fetch
   * @returns {Promise<Array>} - Media items
   */
  async getMedia(igBusinessId, accessToken, limit = 25) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${igBusinessId}/media`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count',
            limit,
            access_token: accessToken
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting media:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram media');
    }
  }

  /**
   * Get comments for a media item
   * @param {String} mediaId - Media ID
   * @param {String} accessToken - Access token
   * @param {Number} limit - Number of comments to fetch
   * @returns {Promise<Array>} - Comments
   */
  async getComments(mediaId, accessToken, limit = 50) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${mediaId}/comments`,
        {
          params: {
            fields: 'id,text,timestamp,username,like_count,replies',
            limit,
            access_token: accessToken
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting comments:', error.response?.data || error.message);
      throw new Error('Failed to get Instagram comments');
    }
  }

  /**
   * Reply to a comment
   * @param {String} commentId - Comment ID
   * @param {String} message - Reply message
   * @param {String} accessToken - Access token
   * @returns {Promise<Object>} - Response
   */
  async replyToComment(commentId, message, accessToken) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${commentId}/replies`,
        null,
        {
          params: {
            message,
            access_token: accessToken
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error.response?.data || error.message);
      throw new Error('Failed to reply to Instagram comment');
    }
  }

  /**
   * Hide a comment
   * @param {String} commentId - Comment ID
   * @param {Boolean} hide - Whether to hide the comment
   * @param {String} accessToken - Access token
   * @returns {Promise<Object>} - Response
   */
  async hideComment(commentId, hide, accessToken) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${commentId}`,
        null,
        {
          params: {
            hide,
            access_token: accessToken
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error hiding comment:', error.response?.data || error.message);
      throw new Error('Failed to hide Instagram comment');
    }
  }
}

module.exports = new InstagramService(); 