const express = require('express');
const { webhookController } = require('../controllers');

const router = express.Router();

// These routes are not protected with authentication
// as they are called by Meta/Instagram

// Webhook verification endpoint
router.get('/instagram', webhookController.verifyWebhook);

// Webhook event handling endpoint
router.post('/instagram', webhookController.handleWebhook);

module.exports = router; 