require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./app');

// Models
const User = require('./models/User');
const Note = require('./models/Note');
const Post = require('./models/Post');

const PORT = process.env.PORT || 5000;

const startDevServer = async () => {
  try {
    console.log('[Dev Server] Starting temporary in-memory MongoDB instance for local preview...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Dev Server] Connected to in-memory database:', uri);

    // Sync schema indexes
    console.log('[Dev Server] Syncing indexes...');
    await Promise.all([User.init(), Note.init(), Post.init()]);

    // Seed sample data for immediate testing
    console.log('[Dev Server] Seeding initial test accounts and sample data...');
    const admin = await User.create({
      username: 'System Admin',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
      interests: ['security', 'management', 'chess']
    });

    const alice = await User.create({
      username: 'Alice Smith',
      email: 'alice@example.com',
      password: 'UserPassword123!',
      role: 'user',
      interests: ['chess', 'reading', 'ai']
    });

    const bob = await User.create({
      username: 'Bob Jones',
      email: 'bob@example.com',
      password: 'UserPassword123!',
      role: 'user',
      interests: ['reading', 'music', 'gaming']
    });

    await Note.insertMany([
      { title: 'Alice Note 1: Architecture Review', content: 'Detailed review of microservices vs monolith.', userId: alice._id },
      { title: 'Alice Note 2: MongoDB Indexes', content: 'Understanding compound indexes and index prefixing.', userId: alice._id },
      { title: 'Alice Note 3: Reading List', content: 'Clean Code, Designing Data-Intensive Applications.', userId: alice._id },
      { title: 'Bob Note 1: Guitar Chords', content: 'ii - V - I progressions in C major.', userId: bob._id },
      { title: 'Admin Note: Server Maintenance', content: 'Scheduled backup and security patch update.', userId: admin._id }
    ]);

    await Post.insertMany([
      { title: 'Alice on Quantum Computing', content: 'Thoughts on qubits and state superposition.', userId: alice._id },
      { title: 'Alice on Chess Strategies', content: 'Mastering the Sicilian Defense in rapid time controls.', userId: alice._id },
      { title: 'Bob on Indie Game Dev', content: 'How to build your first 2D physics engine in JavaScript.', userId: bob._id }
    ]);

    app.listen(PORT, () => {
      console.log('\n============================================================');
      console.log(`[Dev Server] Application is LIVE at: http://localhost:${PORT}`);
      console.log('------------------------------------------------------------');
      console.log('Demo Accounts:');
      console.log('  Admin: admin@example.com / AdminPassword123!');
      console.log('  User:  alice@example.com / UserPassword123!');
      console.log('  User:  bob@example.com   / UserPassword123!');
      console.log('============================================================\n');
    });
  } catch (error) {
    console.error('[Dev Server Error]:', error);
    process.exit(1);
  }
};

startDevServer();

