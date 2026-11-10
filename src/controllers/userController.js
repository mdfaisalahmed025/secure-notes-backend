const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');

const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated list of all users (Admin only)
 * @access  Private (Admin only)
 * @index   Supported by { createdAt: -1 }
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select('-password')
        .sort({ createdAt: -1 }) // Supported by { createdAt: -1 } index
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user profile by ID (Admin only)
 * @access  Private (Admin only)
 * @index   Supported by default _id primary key index
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/users
 * @desc    Admin creates a new user
 * @access  Private (Admin only)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, role, interests } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.'
      });
    }

    // Check duplicate email using { email: 1 } index
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    let parsedInterests = [];
    if (Array.isArray(interests)) {
      parsedInterests = interests.map((i) => String(i).trim().toLowerCase()).filter(Boolean);
    }

    const newUser = await User.create({
      username,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      interests: parsedInterests
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        interests: newUser.interests,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Admin updates an existing user
 * @access  Private (Admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { username, email, role, interests, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (interests && Array.isArray(interests)) {
      user.interests = interests.map((i) => String(i).trim().toLowerCase()).filter(Boolean);
    }
    if (password) {
      user.password = password; // Will be hashed by pre('save') hook
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        interests: user.interests,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Admin deletes a user and cascades related notes and posts
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Cascade delete user's notes and posts
    await Promise.all([
      Note.deleteMany({ userId: user._id }),
      Post.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

