const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Post content is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author User ID is required']
    }
  },
  {
    timestamps: true
  }
);

/**
 * STRICT INDEX DEFINITIONS VIA schema.index()
 * 
 * 1. { userId: 1, createdAt: -1 }:
 *    Supports Scenario 2 Aggregation ($lookup on userId):
 *    When performing $lookup from User to Posts where foreignField is 'userId',
 *    this index ensures MongoDB uses an indexed lookup instead of a collection scan.
 *    It also covers sorting the user's posts by newest first.
 */
postSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);

