const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'fallback_secure_jwt_secret_key_123!';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, interests, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password.'
      });
    }

    // Check if user already exists (uses { email: 1 } unique index)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Allow role assignment only if specified, default is 'user'
    const userRole = role === 'admin' ? 'admin' : 'user';

    // Normalize interests to an array of trimmed lowercase strings
    let parsedInterests = [];
    if (Array.isArray(interests)) {
      parsedInterests = interests.map((i) => String(i).trim().toLowerCase()).filter(Boolean);
    } else if (typeof interests === 'string') {
      parsedInterests = interests
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter(Boolean);
    }

    const user = await User.create({
      username,
      email,
      password,
      role: userRole,
      interests: parsedInterests
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        interests: user.interests,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Query uses the unique index on { email: 1 }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        interests: user.interests,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
};

