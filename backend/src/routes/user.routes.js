const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// TODO: Add user management endpoints
// For now, just a placeholder endpoint
router.get('/me', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

// Admin-only routes
router.use(authorize('admin'));

// TODO: Add admin-only user management endpoints

module.exports = router; 