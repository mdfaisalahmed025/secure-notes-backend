const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Exclude password from query results by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    interests: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

/**
 * STRICT INDEX DEFINITIONS VIA schema.index()
 * Only indexes strictly required for queries and aggregations are defined.
 * 
 * 1. { email: 1 } (Unique):
 *    Supports login/profile lookup by email with fast single-key point read
 *    and guarantees uniqueness.
 * 
 * 2. { interests: 1 }:
 *    Supports Scenario 1 aggregation: grouping users by interests via $unwind.
 *    Multikey index on the array elements.
 * 
 * 3. { createdAt: -1 }:
 *    Supports Admin listing users with pagination and chronological sorting.
 */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ interests: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save hook to hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

