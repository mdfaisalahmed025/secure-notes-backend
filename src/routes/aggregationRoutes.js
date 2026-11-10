const express = require('express');
const router = express.Router();
const aggregationController = require('../controllers/aggregationController');
const protect = require('../middleware/auth');

// Protected aggregation routes
router.use(protect);

// Scenario 1: Group by Interests
router.get('/group-by-interests', aggregationController.groupByInterests);

// Scenario 2: User Posts ($lookup)
router.get('/user-posts/:userId', aggregationController.getUserPostsWithLookup);

module.exports = router;

