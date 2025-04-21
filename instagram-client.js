const axios = require('axios');
require('dotenv').config();

class InstagramAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://graph.instagram.com';
    this.apiVersion = 'v18.0'; // Update this to the latest version if needed
  }

  // Get basic profile information
  async getProfile() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/me`,
        {
          params: {
            fields: 'id,username',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user's media
  async getMedia(limit = 10) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/me/media`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
            limit,
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get information about a specific media post
  async getMediaById(mediaId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.apiVersion}/${mediaId}`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching media by ID:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = InstagramAPI; 