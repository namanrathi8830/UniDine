const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware to authenticate requests using JWT
 */
module.exports = async (req, res, next) => {
  try {
    // TEMPORARY BYPASS FOR TESTING ONLY - REMOVE IN PRODUCTION
    // This allows accessing the dashboard without authentication
    if (process.env.NODE_ENV !== 'production') {
      // Set a test user using the ID from the logs
      req.user = {
        id: "6807512dd6fdaf98be33ffc2", // User ID from logs
        email: "instagram_1237269891733766@example.com",
        role: "user"
      };
      return next();
    }
    
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No authentication token, access denied' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on decoded token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or token is invalid' 
      });
    }
    
    // Add user info to request object
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role || 'user'
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token is invalid or expired',
      error: error.message
    });
  }
}; 