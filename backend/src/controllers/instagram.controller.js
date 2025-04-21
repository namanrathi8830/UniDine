const { InstagramAccount, Interaction } = require('../models');
const { instagramService, aiService } = require('../services');

/**
 * Start Instagram account connection process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.startConnection = async (req, res) => {
  try {
    // Redirect to Facebook login dialog
    const redirectUrl = process.env.INSTAGRAM_REDIRECT_URI;
    const appId = process.env.INSTAGRAM_APP_ID;
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=instagram_basic,instagram_content_publish,instagram_manage_comments,pages_show_list,pages_read_engagement`;
    
    res.status(200).json({
      status: 'success',
      data: {
        authUrl
      }
    });
  } catch (error) {
    console.error('Start Instagram connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error starting Instagram connection'
    });
  }
};

/**
 * Handle OAuth callback and finish connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: 'Authorization code is required'
      });
    }
    
    // Exchange code for token
    const tokenResponse = await instagramService.exchangeToken(code);
    const accessToken = tokenResponse.access_token;
    
    // Get Instagram business account
    const igAccount = await instagramService.getBusinessAccount(accessToken);
    
    // Save account to database
    const existingAccount = await InstagramAccount.findOne({ 
      igBusinessId: igAccount.id,
      userId: req.user._id
    });
    
    if (existingAccount) {
      // Update existing account
      existingAccount.accessToken = accessToken;
      existingAccount.username = igAccount.username;
      existingAccount.name = igAccount.name;
      existingAccount.profilePicture = igAccount.profile_picture_url;
      existingAccount.followerCount = igAccount.followers_count;
      existingAccount.mediaCount = igAccount.media_count;
      existingAccount.lastSync = new Date();
      
      await existingAccount.save();
      
      return res.status(200).json({
        status: 'success',
        message: 'Instagram account updated successfully',
        data: {
          account: {
            id: existingAccount._id,
            username: existingAccount.username,
            name: existingAccount.name,
            profilePicture: existingAccount.profilePicture
          }
        }
      });
    }
    
    // Create new account
    const newAccount = new InstagramAccount({
      userId: req.user._id,
      igBusinessId: igAccount.id,
      username: igAccount.username,
      name: igAccount.name,
      profilePicture: igAccount.profile_picture_url,
      accessToken: accessToken,
      tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      followerCount: igAccount.followers_count,
      mediaCount: igAccount.media_count,
      lastSync: new Date()
    });
    
    await newAccount.save();
    
    // Add account to user's accounts
    req.user.instagramAccounts.push(newAccount._id);
    await req.user.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Instagram account connected successfully',
      data: {
        account: {
          id: newAccount._id,
          username: newAccount.username,
          name: newAccount.name,
          profilePicture: newAccount.profilePicture
        }
      }
    });
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error connecting Instagram account'
    });
  }
};

/**
 * Get user's Instagram accounts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await InstagramAccount.find({ userId: req.user._id });
    
    res.status(200).json({
      status: 'success',
      data: {
        accounts: accounts.map(account => ({
          id: account._id,
          igBusinessId: account.igBusinessId,
          username: account.username,
          name: account.name,
          profilePicture: account.profilePicture,
          followerCount: account.followerCount,
          mediaCount: account.mediaCount,
          automationSettings: account.automationSettings,
          isActive: account.isActive,
          lastSync: account.lastSync
        }))
      }
    });
  } catch (error) {
    console.error('Get Instagram accounts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting Instagram accounts'
    });
  }
};

/**
 * Get media for an Instagram account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMedia = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Verify account belongs to user
    const account = await InstagramAccount.findOne({
      _id: accountId,
      userId: req.user._id
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Instagram account not found'
      });
    }
    
    // Get media from Instagram API
    const media = await instagramService.getMedia(
      account.igBusinessId,
      account.accessToken
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        media
      }
    });
  } catch (error) {
    console.error('Get Instagram media error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting Instagram media'
    });
  }
};

/**
 * Get comments for a media item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getComments = async (req, res) => {
  try {
    const { accountId, mediaId } = req.params;
    
    // Verify account belongs to user
    const account = await InstagramAccount.findOne({
      _id: accountId,
      userId: req.user._id
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Instagram account not found'
      });
    }
    
    // Get comments from Instagram API
    const comments = await instagramService.getComments(
      mediaId,
      account.accessToken
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        comments
      }
    });
  } catch (error) {
    console.error('Get Instagram comments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting Instagram comments'
    });
  }
};

/**
 * Respond to a comment with AI or template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.respondToComment = async (req, res) => {
  try {
    const { accountId, commentId } = req.params;
    const { responseType, responseContent, templateId, useAI } = req.body;
    
    // Verify account belongs to user
    const account = await InstagramAccount.findOne({
      _id: accountId,
      userId: req.user._id
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Instagram account not found'
      });
    }
    
    // Get comment from database
    const interaction = await Interaction.findOne({
      'fromUser.id': commentId,
      accountId
    });
    
    if (!interaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Handle different response types
    let responseMessage;
    
    if (useAI) {
      // Generate AI response
      responseMessage = await aiService.generateResponse({
        message: interaction.content,
        businessName: account.name || account.username,
        prompt: account.automationSettings.aiPrompt,
        conversationHistory: []
      });
    } else if (responseType === 'template' && templateId) {
      // Use template response
      const template = await ResponseTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Response template not found'
        });
      }
      responseMessage = template.content;
    } else if (responseType === 'custom') {
      // Use custom response
      responseMessage = responseContent;
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid response type'
      });
    }
    
    // Send response to Instagram
    const response = await instagramService.replyToComment(
      commentId,
      responseMessage,
      account.accessToken
    );
    
    // Update interaction in database
    interaction.responded = true;
    interaction.response = {
      content: responseMessage,
      timestamp: new Date(),
      automated: useAI || responseType === 'template',
      aiGenerated: useAI
    };
    
    await interaction.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Response sent successfully',
      data: {
        response: interaction.response
      }
    });
  } catch (error) {
    console.error('Respond to Instagram comment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error responding to Instagram comment'
    });
  }
}; 