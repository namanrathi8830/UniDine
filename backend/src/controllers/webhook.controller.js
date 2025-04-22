const crypto = require('crypto');
const { InstagramAccount, Interaction } = require('../models');
const { aiService } = require('../services');
const { restaurantExtractionController } = require('./index');
const { extractRestaurantInfo } = require('../utils/extractionUtils');
const { saveRestaurantFromMessage } = require('./restaurant-extraction.controller');
const User = require('../models/user.model');

/**
 * Verify webhook subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyWebhook = (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Check against both possible env variable names to be more robust
    const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.VERIFY_TOKEN;
    
    console.log('Received verification request:');
    console.log('- Mode:', mode);
    console.log('- Token:', token);
    console.log('- Our verify token:', verifyToken);
    
    // Verify token matches environment variable
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed');
      console.error(`Received token: ${token} does not match expected token`);
      res.sendStatus(403);
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.sendStatus(500);
  }
};

/**
 * Handle webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Verify request signature
    const signature = req.headers['x-hub-signature'];
    
    if (!signature) {
      console.error('No signature provided');
      return res.sendStatus(403);
    }
    
    const elements = signature.split('=');
    const signatureHash = elements[1];
    
    const expectedHash = crypto
      .createHmac('sha1', process.env.INSTAGRAM_APP_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signatureHash !== expectedHash) {
      console.error('Signature validation failed');
      return res.sendStatus(403);
    }
    
    // Process webhook event
    const data = req.body;
    
    // Respond immediately to acknowledge receipt
    res.sendStatus(200);
    
    // Process events asynchronously
    processWebhookEvents(data);
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.sendStatus(500);
  }
};

/**
 * Process webhook events asynchronously
 * @param {Object} data - Webhook data
 */
async function processWebhookEvents(data) {
  try {
    if (!data.object || !data.entry || !data.entry.length) {
      console.log('Invalid webhook data received');
      return;
    }
    
    for (const entry of data.entry) {
      if (!entry.changes || !entry.changes.length) {
        continue;
      }
      
      for (const change of entry.changes) {
        if (change.field !== 'comments' && change.field !== 'messages') {
          continue;
        }
        
        if (change.field === 'comments') {
          await handleCommentEvent(change.value);
        } else if (change.field === 'messages') {
          await handleMessageEvent(change.value);
        }
      }
    }
  } catch (error) {
    console.error('Error processing webhook events:', error);
  }
}

/**
 * Handle comment events
 * @param {Object} value - Comment event data
 */
async function handleCommentEvent(value) {
  try {
    const { media_id, comment_id, text, from, timestamp } = value;
    
    if (!media_id || !comment_id || !from) {
      console.log('Missing required comment data');
      return;
    }
    
    // Find account by Instagram business ID
    const igAccount = await InstagramAccount.findOne({
      igBusinessId: value.id // The Instagram business account ID
    });
    
    if (!igAccount) {
      console.log(`Instagram account not found for ID: ${value.id}`);
      return;
    }
    
    // Check if comment already exists
    const existingInteraction = await Interaction.findOne({
      'fromUser.id': comment_id,
      accountId: igAccount._id
    });
    
    if (existingInteraction) {
      console.log(`Comment ${comment_id} already processed`);
      return;
    }
    
    // Analyze sentiment and intent
    const analysis = await aiService.analyzeMessage(text);
    
    // Create new interaction record
    const interaction = new Interaction({
      accountId: igAccount._id,
      type: 'comment',
      mediaId: media_id,
      fromUser: {
        id: comment_id,
        username: from.username,
        name: from.name || '',
        profilePicture: from.profile_picture || ''
      },
      content: text,
      timestamp: new Date(timestamp),
      sentiment: analysis.sentiment,
      intent: analysis.intent
    });
    
    await interaction.save();
    
    // Check for automatic response settings
    if (igAccount.automationSettings?.replyToComments?.enabled) {
      await handleAutomaticCommentResponse(igAccount, interaction);
    }
  } catch (error) {
    console.error('Error handling comment event:', error);
  }
}

/**
 * Handle message events
 * @param {Object} value - Message event data
 */
async function handleMessageEvent(value) {
  try {
    const { sender, recipient, timestamp, message } = value;
    
    if (!sender || !recipient || !message) {
      console.log('Missing required message data');
      return;
    }
    
    // Find account by Instagram business ID
    const igAccount = await InstagramAccount.findOne({
      igBusinessId: recipient.id // The Instagram business account ID
    });
    
    if (!igAccount) {
      console.log(`Instagram account not found for ID: ${recipient.id}`);
      return;
    }
    
    // Check if message already exists
    const existingInteraction = await Interaction.findOne({
      'fromUser.id': sender.id,
      accountId: igAccount._id,
      type: 'direct_message',
      timestamp: new Date(timestamp)
    });
    
    if (existingInteraction) {
      console.log(`Message from ${sender.id} at ${timestamp} already processed`);
      return;
    }
    
    // Find associated user
    const user = await User.findById(igAccount.userId);
    if (!user) {
      console.log(`User not found for Instagram account ID: ${igAccount._id}`);
      return;
    }
    
    // Analyze sentiment and intent
    const analysis = await aiService.analyzeMessage(message.text);
    
    // Create new interaction record
    const interaction = new Interaction({
      accountId: igAccount._id,
      type: 'direct_message',
      fromUser: {
        id: sender.id,
        username: sender.username || '',
        name: sender.name || '',
        profilePicture: ''
      },
      content: message.text,
      timestamp: new Date(timestamp),
      sentiment: analysis.sentiment,
      intent: analysis.intent
    });
    
    await interaction.save();
    
    // NEW CODE: Check if the message appears to be a restaurant recommendation
    // and process it accordingly
    try {
      // Use the same analysis that's used in the extraction endpoint
      const extractionResult = await restaurantExtractionController.analyzeTextForRestaurant(message.text);
      
      if (extractionResult.success && extractionResult.restaurant) {
        console.log('Restaurant mentioned in message, processing for user collection');
        
        // Save the restaurant to the user's collection
        await restaurantExtractionController.saveRestaurantFromMessage(
          extractionResult.restaurant,
          message.text,
          user._id
        );
        
        // If this is a recommendation, maybe send an acknowledgment
        if (extractionResult.isRecommendation) {
          // This could be added later, send a message like "Thanks for the restaurant recommendation!"
        }
      }
    } catch (extractionError) {
      console.error('Error processing restaurant extraction:', extractionError);
      // Don't block the rest of the flow if extraction fails
    }
    
    // Check for automatic response settings
    if (igAccount.automationSettings?.replyToDMs?.enabled) {
      await handleAutomaticDMResponse(igAccount, interaction);
    }
  } catch (error) {
    console.error('Error handling message event:', error);
  }
}

/**
 * Handle automatic response to comments based on settings
 * @param {Object} account - Instagram account
 * @param {Object} interaction - Comment interaction
 */
async function handleAutomaticCommentResponse(account, interaction) {
  try {
    const { replyToComments, useAI, aiPrompt } = account.automationSettings;
    
    if (useAI) {
      // Generate AI response
      const response = await aiService.generateResponse({
        message: interaction.content,
        businessName: account.name || account.username,
        prompt: aiPrompt,
        conversationHistory: []
      });
      
      // TODO: Send response via Instagram API
      
      // Update interaction
      interaction.responded = true;
      interaction.response = {
        content: response,
        timestamp: new Date(),
        automated: true,
        aiGenerated: true
      };
      
      await interaction.save();
      return;
    }
    
    // Check for template matching
    const templates = replyToComments.templates || [];
    
    for (const template of templates) {
      const triggers = template.triggers || [];
      const matchesTrigger = triggers.some(trigger => 
        interaction.content.toLowerCase().includes(trigger.toLowerCase())
      );
      
      if (matchesTrigger) {
        // TODO: Send response via Instagram API
        
        // Update interaction
        interaction.responded = true;
        interaction.response = {
          content: template.content,
          timestamp: new Date(),
          automated: true,
          template: template._id
        };
        
        await interaction.save();
        return;
      }
    }
  } catch (error) {
    console.error('Error handling automatic comment response:', error);
  }
}

/**
 * Handle automatic response to direct messages based on settings
 * @param {Object} account - Instagram account
 * @param {Object} interaction - DM interaction
 */
async function handleAutomaticDMResponse(account, interaction) {
  try {
    const { replyToDMs, useAI, aiPrompt } = account.automationSettings;
    
    if (useAI) {
      // Generate AI response
      const response = await aiService.generateResponse({
        message: interaction.content,
        businessName: account.name || account.username,
        prompt: aiPrompt,
        conversationHistory: []
      });
      
      // TODO: Send response via Instagram API
      
      // Update interaction
      interaction.responded = true;
      interaction.response = {
        content: response,
        timestamp: new Date(),
        automated: true,
        aiGenerated: true
      };
      
      await interaction.save();
      return;
    }
    
    // Check for template matching
    const templates = replyToDMs.templates || [];
    
    for (const template of templates) {
      const triggers = template.triggers || [];
      const matchesTrigger = triggers.some(trigger => 
        interaction.content.toLowerCase().includes(trigger.toLowerCase())
      );
      
      if (matchesTrigger) {
        // TODO: Send response via Instagram API
        
        // Update interaction
        interaction.responded = true;
        interaction.response = {
          content: template.content,
          timestamp: new Date(),
          automated: true,
          template: template._id
        };
        
        await interaction.save();
        return;
      }
    }
  } catch (error) {
    console.error('Error handling automatic DM response:', error);
  }
}

/**
 * Handle Instagram messages
 * @param {Object} messageData - Message data from webhook
 */
exports.handleInstagramMessage = async (messageData) => {
  try {
    console.log('==== PROCESSING INSTAGRAM MESSAGE ====');
    console.log('Message data:', JSON.stringify(messageData, null, 2));
    
    const senderId = messageData.sender.id;
    
    // Find user with this Instagram ID
    console.log(`Looking for user with Instagram ID: ${senderId}`);
    const user = await User.findOne({ instagramId: senderId });
    
    if (!user) {
      // Create a temporary user automatically when we receive a message
      // from an Instagram user we don't know yet - this allows us to track recommendations
      // until they create a real account
      console.log(`No user found for Instagram ID ${senderId}. Creating temporary user.`);
      const newUser = new User({
        name: `Instagram User ${senderId}`,
        email: `instagram_${senderId}@example.com`,
        password: `temporaryPassword${Math.random().toString(36).substring(2, 10)}`,
        instagramId: senderId,
        instagramUsername: `instagram_user_${senderId}`,
        isTemporary: true // Flag to indicate this is a temporary user
      });
      
      await newUser.save();
      console.log(`Created temporary user: ${newUser._id} for Instagram ID: ${senderId}`);
      
      // Now use this user
      console.log(`Using temporary user: ${JSON.stringify(newUser, null, 2)}`);
      
      // Send welcome message
      await exports.sendInstagramMessage(senderId, 
        `👋 Welcome to UniDine! I'll help you save restaurant recommendations from your Instagram messages. ` +
        `Simply mention a restaurant, and I'll save it for you. Visit our website to create an account and manage your saved restaurants.`
      );
      
      await processMessage(messageData, newUser, senderId);
    } else {
      console.log(`Found existing user: ${user._id} for Instagram ID: ${senderId}`);
      console.log(`Using user: ${JSON.stringify(user, null, 2)}`);
      
      await processMessage(messageData, user, senderId);
    }
  } catch (error) {
    console.error('Error handling Instagram message:', error);
  }
};

/**
 * Process Instagram message content
 * @param {Object} messageData - Message data from webhook
 * @param {Object} user - User object
 * @param {String} senderId - Instagram sender ID
 */
async function processMessage(messageData, user, senderId) {
  try {
    // Check if the message contains text or attachments
    if (messageData.message.text) {
      // Process text message
      console.log(`Processing text message: ${messageData.message.text}`);
      
      // Check if the message is a restaurant recommendation
      const extractionResult = await extractRestaurantInfo(messageData.message.text);
      
      if (extractionResult.success && extractionResult.restaurant.extractionConfidence.overall > 0.5) {
        console.log(`Extracted restaurant from message: ${JSON.stringify(extractionResult.restaurant, null, 2)}`);
        
        // Save the restaurant
        const savedResult = await saveRestaurantFromMessage(
          extractionResult.restaurant,
          messageData.message.text,
          user._id
        );
        
        if (savedResult.success) {
          // Send confirmation message
          await exports.sendInstagramMessage(senderId, 
            `Thanks for sharing! I've saved "${savedResult.restaurant.name}" to your UniDine collection. You can view it in your dashboard.`
          );
        } else {
          console.error(`Failed to save restaurant: ${savedResult.message}`);
        }
      } else {
        console.log('Message does not contain a restaurant recommendation or confidence too low');
      }
    } else if (messageData.message.attachments) {
      console.log('Processing message with attachments');
      
      // Process each attachment
      for (const attachment of messageData.message.attachments) {
        // Process based on attachment type
        if (attachment.type === 'image') {
          console.log('Instagram image attachment detected');
          // Handle image - we could implement image recognition for restaurant menus/signage in the future
        } else if (attachment.type === 'video') {
          console.log('Instagram video attachment detected');
          // Handle video
        } else if (attachment.type === 'location') {
          console.log('Instagram location attachment detected');
          // Handle location - could be a restaurant location
          if (attachment.payload && attachment.payload.coordinates) {
            const { lat, long } = attachment.payload.coordinates;
            console.log(`Location shared - Latitude: ${lat}, Longitude: ${long}`);
            
            // We could look up restaurants at these coordinates
          }
        } else if (attachment.type === 'ig_reel' && attachment.payload && attachment.payload.title) {
          console.log('Instagram media attachment detected');
          console.log(`Processing media with title: ${attachment.payload.title}`);
          console.log(`Media link: https://www.instagram.com/reel/${attachment.payload.reel_video_id}`);
          
          // Extract restaurant info from reel title
          console.log(`Extracting restaurant info from reel title: ${attachment.payload.title}`);
          const extractionResult = await extractRestaurantInfo(attachment.payload.title);
          
          if (extractionResult.success && extractionResult.restaurant.extractionConfidence.overall > 0.5) {
            // Add media link to the restaurant
            extractionResult.restaurant.mediaLink = `https://www.instagram.com/reel/${attachment.payload.reel_video_id}`;
            extractionResult.restaurant.originalMessage = attachment.payload.title;
            
            console.log(`Extracted restaurant from reel: ${JSON.stringify(extractionResult.restaurant, null, 2)}`);
            
            // Save the restaurant
            const savedResult = await saveRestaurantFromMessage(
              extractionResult.restaurant,
              attachment.payload.title,
              user._id
            );
            
            if (savedResult.success) {
              // Send confirmation message
              await exports.sendInstagramMessage(senderId, 
                `Thanks for sharing! I've saved "${savedResult.restaurant.name}" to your UniDine collection. You can view it in your dashboard.`
              );
            } else {
              console.error(`Failed to save restaurant: ${savedResult.message}`);
            }
          } else {
            console.log('Reel does not contain a restaurant recommendation or confidence too low');
          }
        }
      }
    } else {
      console.log('Message contains no text or attachments');
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
} 