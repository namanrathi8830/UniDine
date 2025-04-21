const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {Object} user - User data to include in token
 * @returns {String} - JWT token
 */
function generateToken(user) {
  const payload = {
    user: {
      id: user._id
    }
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = {
  generateToken
}; 