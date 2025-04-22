const express = require('express');
const { instagramController } = require('../controllers');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Instagram account connection
router.get('/auth/start', instagramController.startConnection);
router.get('/auth/callback', instagramController.handleCallback);

// Instagram account management
router.get('/accounts', instagramController.getAccounts);

// Media endpoints
router.get('/accounts/:accountId/media', instagramController.getMedia);
router.get('/accounts/:accountId/media/:mediaId/comments', instagramController.getComments);

// Interaction endpoints
router.post('/accounts/:accountId/comments/:commentId/reply', instagramController.respondToComment);

// Check Instagram connection status
router.get('/status', instagramController.getConnectionStatus);

module.exports = router; 