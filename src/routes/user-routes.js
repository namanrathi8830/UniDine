const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const InstagramClient = require('../services/instagram-client');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Create and send JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error('Error registering user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Create and send JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email, settings } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (settings) updateFields.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error('Error updating user profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Instagram Authorization URL generation
router.get('/auth/instagram/url', auth, (req, res) => {
  try {
    const instagramClient = new InstagramClient();
    const authUrl = instagramClient.getAuthorizationUrl();
    res.json({ url: authUrl });
  } catch (err) {
    console.error('Error generating Instagram auth URL:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Instagram callback handler
router.get('/auth/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // Verify state parameter (anti-CSRF)
    // Implementation depends on how you're storing state
    
    const instagramClient = new InstagramClient();
    const tokenData = await instagramClient.exchangeCodeForToken(code);
    
    // Get user profile from Instagram
    const profile = await instagramClient.getProfile(tokenData.access_token);
    
    // Find associated user from state or session
    // This is a simplified example - you'd need proper user identification
    const userId = jwt.verify(state, process.env.JWT_SECRET).user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Connect Instagram account to user
    await user.connectInstagram({
      id: profile.id,
      username: profile.username,
      accessToken: tokenData.access_token,
      tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000)
    });
    
    // Redirect to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL}/instagram-connected`);
  } catch (err) {
    console.error('Error handling Instagram callback:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/instagram-error`);
  }
});

// Disconnect Instagram account
router.delete('/instagram', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.instagramId = undefined;
    user.instagramUsername = undefined;
    user.instagramAccessToken = undefined;
    user.tokenExpiry = undefined;
    
    await user.save();
    
    res.json({ message: 'Instagram account disconnected' });
  } catch (err) {
    console.error('Error disconnecting Instagram:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 