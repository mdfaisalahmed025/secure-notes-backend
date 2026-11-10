require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Cleaning collections...');

    await Promise.all([
      User.deleteMany({}),
      Note.deleteMany({}),
      Post.deleteMany({})
    ]);

    console.log('[Seed] Creating users...');
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

    const charlie = await User.create({
      username: 'Charlie Brown',
      email: 'charlie@example.com',
      password: 'UserPassword123!',
      role: 'user',
      interests: ['chess', 'photography', 'travel']
    });

    console.log('[Seed] Creating notes for pagination & RBAC testing...');
    const sampleNotes = [
      // Alice's notes
      { title: 'Alice Note 1: Architecture Review', content: 'Detailed review of microservices vs monolith.', userId: alice._id },
      { title: 'Alice Note 2: MongoDB Indexes', content: 'Understanding compound indexes and index prefixing.', userId: alice._id },
      { title: 'Alice Note 3: Reading List', content: 'Clean Code, Designing Data-Intensive Applications.', userId: alice._id },
      { title: 'Alice Note 4: AI Research', content: 'Exploring transformer attention mechanisms and RAG.', userId: alice._id },
      { title: 'Alice Note 5: Grocery Shopping', content: 'Coffee, oat milk, green tea, dark chocolate.', userId: alice._id },
      
      // Bob's notes
      { title: 'Bob Note 1: Guitar Chord Progressions', content: 'ii - V - I in C major and jazz substitutions.', userId: bob._id },
      { title: 'Bob Note 2: Workout Routine', content: 'Monday push, Tuesday pull, Wednesday legs.', userId: bob._id },
      { title: 'Bob Note 3: Meeting Notes', content: 'Sprint planning agenda and retro action items.', userId: bob._id },

      // Admin's notes
      { title: 'Admin Note: Server Maintenance', content: 'Scheduled backup and security patch update.', userId: admin._id }
    ];

    await Note.insertMany(sampleNotes);

    console.log('[Seed] Creating posts for Scenario 2 ($lookup aggregation)...');
    const samplePosts = [
      { title: 'Alice on Quantum Computing', content: 'Thoughts on qubits and state superposition.', userId: alice._id },
      { title: 'Alice on Chess Strategies', content: 'Mastering the Sicilian Defense in rapid time controls.', userId: alice._id },
      { title: 'Bob on Indie Game Dev', content: 'How to build your first 2D physics engine in JavaScript.', userId: bob._id },
      { title: 'Charlie on Landscape Photography', content: 'Golden hour aperture settings and ND filter guides.', userId: charlie._id }
    ];

    await Post.insertMany(samplePosts);

    console.log('[Seed] Syncing indexes...');
    await Promise.all([User.init(), Note.init(), Post.init()]);

    console.log('\n=============================================');
    console.log(' SEEDING COMPLETE');
    console.log('=============================================');
    console.log('Test Accounts:');
    console.log(' Admin: admin@example.com / AdminPassword123!');
    console.log(' User:  alice@example.com / UserPassword123!');
    console.log(' User:  bob@example.com / UserPassword123!');
    console.log(' User:  charlie@example.com / UserPassword123!');
    console.log('=============================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();

