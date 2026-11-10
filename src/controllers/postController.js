const Post = require('../models/Post');

const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * @route   POST /api/posts
 * @desc    Create a new post (visible to everyone)
 * @access  Private (User, Admin)
 */
exports.createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Post title and content are required.'
      });
    }

    const post = await Post.create({
      title,
      content,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/posts
 * @desc    Get all public posts with pagination
 * @access  Public / Private
 */
exports.getAllPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [total, posts] = await Promise.all([
      Post.countDocuments(),
      Post.find()
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: posts,
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

