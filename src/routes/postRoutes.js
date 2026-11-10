const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const protect = require('../middleware/auth');

// Public route to view all posts
router.get('/', postController.getAllPosts);

// Protected route to create a post
router.post('/', protect, postController.createPost);

module.exports = router;

