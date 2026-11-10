const Note = require('../models/Note');

/**
 * Helper to parse pagination params
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private (User, Admin)
 */
exports.createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Note title and content are required.'
      });
    }

    const note = await Note.create({
      title,
      content,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      data: note
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notes
 * @desc    Get paginated list of logged-in user's own notes
 * @access  Private (User, Admin)
 * @index   Supported by { userId: 1, createdAt: -1 }
 */
exports.getUserNotes = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const filter = { userId: req.user._id };

    // Both count and find use the indexed field userId
    const [total, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter)
        .sort({ createdAt: -1 }) // Covered by compound index { userId: 1, createdAt: -1 }
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: notes,
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
 * @route   GET /api/notes/:id
 * @desc    Get a single note by ID
 * @access  Private (Owner can view, Admin can view any)
 * @index   Supported by default _id primary index
 */
exports.getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate('userId', 'username email');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    // Role check: Only owner or admin can view
    const isOwner = note.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only view your own notes.'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/notes/:id
 * @desc    Update an existing note
 * @access  Private (Owner can update, Admin inherits user capabilities)
 */
exports.updateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    const isOwner = note.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only update your own notes.'
      });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    const updatedNote = await note.save();

    res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      data: updatedNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Private (Owner or Admin)
 */
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    const isOwner = note.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only delete your own notes.'
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/notes
 * @desc    Get paginated list of all notes from all users (Admin only)
 * @access  Private (Admin only)
 * @index   Supported by { createdAt: -1 }
 */
exports.getAllNotesAdmin = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [total, notes] = await Promise.all([
      Note.countDocuments(),
      Note.find()
        .populate('userId', 'username email role')
        .sort({ createdAt: -1 }) // Covered by { createdAt: -1 } index
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: notes,
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

