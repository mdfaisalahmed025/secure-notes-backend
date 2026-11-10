const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Scenario 1: Group Users by Interests
 * 
 * Context: User profiles contain a list of interests (e.g. ['chess', 'reading']).
 * Task: Specific view to see users grouped by interests.
 * Constraint: You must use EXACTLY ONE collection.aggregate() call. Do not use any other methods.
 * Supported by: UserSchema.index({ interests: 1 })
 * 
 * @route   GET /api/aggregations/group-by-interests
 * @access  Private (User, Admin)
 */
exports.groupByInterests = async (req, res, next) => {
  try {
    // Exactly ONE collection.aggregate() call
    const result = await User.aggregate([
      // Stage 1: Unwind interests array to denormalize per interest
      { $unwind: '$interests' },

      // Stage 2: Group by each interest and accumulate user profiles
      {
        $group: {
          _id: '$interests',
          totalUsers: { $sum: 1 },
          users: {
            $push: {
              _id: '$_id',
              username: '$username',
              email: '$email',
              role: '$role'
            }
          }
        }
      },

      // Stage 3: Alphabetical sort by interest name
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scenario 2: User Posts ($lookup)
 * 
 * Context: Users can write posts which are stored in a separate Posts collection.
 *          These posts are visible to everyone.
 * Task: Retrieve all posts belonging to a particular user.
 * Constraint: Use a single aggregation pipeline with a $lookup stage.
 * Supported by: PostSchema.index({ userId: 1, createdAt: -1 })
 * 
 * @route   GET /api/aggregations/user-posts/:userId
 * @access  Private (User, Admin)
 */
exports.getUserPostsWithLookup = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format.'
      });
    }

    // Exactly single aggregation pipeline with $lookup stage
    const result = await User.aggregate([
      // Stage 1: Match the specific user by ObjectId
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },

      // Stage 2: Join with 'posts' collection where foreignField 'userId' equals user '_id'
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts'
        }
      },

      // Stage 3: Project relevant user fields and joined posts, omitting sensitive password
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          role: 1,
          interests: 1,
          totalPosts: { $size: '$posts' },
          posts: 1
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    next(error);
  }
};

