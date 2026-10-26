const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'bookleaf_leafdesk_jwt_secret_token_secure_2026',
    { expiresIn: '30d' }
  );
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        authorId: user.authorId,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
        joinedDate: user.joinedDate
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login authentication.'
    });
  }
});

router.get('/me', protect, async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

router.get('/demo-users', async (req, res) => {
  try {
    const users = await User.find({}).select('name email role authorId city').limit(15);
    return res.json({
      success: true,
      users
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve demo users.'
    });
  }
});

module.exports = router;
