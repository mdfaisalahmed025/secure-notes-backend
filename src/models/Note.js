const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    content: {
      type: String,
      required: [true, 'Note content is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
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
 *    Supports standard user note listing:
 *    Query: Note.find({ userId }).sort({ createdAt: -1 }).skip(...).limit(...)
 *    Provides indexed equality matching on userId and pre-sorted chronological order.
 * 
 * 2. { createdAt: -1 }:
 *    Supports Admin listing everyone's notes:
 *    Query: Note.find().sort({ createdAt: -1 }).skip(...).limit(...)
 *    Avoids in-memory sorting across the entire collection.
 */
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);

