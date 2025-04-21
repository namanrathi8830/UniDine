const crypto = require('crypto');
const { InstagramAccount, Interaction } = require('../models');
const { aiService } = require('../services');

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
    
    // Verify token matches environment variable
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed');
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