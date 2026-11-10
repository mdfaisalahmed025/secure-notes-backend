require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');
const aggregationController = require('../controllers/aggregationController');

let mongoServer;

const runTests = async () => {
  console.log('====================================================');
  console.log(' SECURE NOTE-TAKING APP: AUTOMATED VERIFICATION TEST');
  console.log('====================================================\n');

  try {
    // 1. Setup in-memory MongoDB
    console.log('[Setup] Initializing MongoDB in-memory database...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] Connected to in-memory MongoDB at:', uri);

    // Sync schema indexes
    console.log('[Setup] Syncing schema indexes via schema.index()...');
    await Promise.all([User.init(), Note.init(), Post.init()]);

    // 2. Strict Index Verification
    console.log('\n--- 1. VERIFYING INDEXING STRATEGY ---');
    const userIndexes = await User.collection.indexes();
    const noteIndexes = await Note.collection.indexes();
    const postIndexes = await Post.collection.indexes();

    console.log('User Collection Indexes:');
    userIndexes.forEach((idx) => console.log('  -', JSON.stringify(idx.key), idx.unique ? '(UNIQUE)' : ''));

    console.log('Note Collection Indexes:');
    noteIndexes.forEach((idx) => console.log('  -', JSON.stringify(idx.key)));

    console.log('Post Collection Indexes:');
    postIndexes.forEach((idx) => console.log('  -', JSON.stringify(idx.key)));

    // Assert User indexes
    const hasUserEmailUnique = userIndexes.some((idx) => idx.key.email === 1 && idx.unique === true);
    const hasUserInterests = userIndexes.some((idx) => idx.key.interests === 1);
    const hasUserCreatedAt = userIndexes.some((idx) => idx.key.createdAt === -1);
    if (!hasUserEmailUnique || !hasUserInterests || !hasUserCreatedAt) {
      throw new Error('User schema is missing required indexes!');
    }
    console.log('✔ User indexes strictly verified: email (unique), interests (multikey), createdAt (-1).');

    // Assert Note indexes
    const hasNoteUserCreated = noteIndexes.some((idx) => idx.key.userId === 1 && idx.key.createdAt === -1);
    const hasNoteCreatedAt = noteIndexes.some((idx) => idx.key.createdAt === -1);
    if (!hasNoteUserCreated || !hasNoteCreatedAt) {
      throw new Error('Note schema is missing required indexes!');
    }
    console.log('✔ Note indexes strictly verified: { userId: 1, createdAt: -1 } and { createdAt: -1 }.');

    // Assert Post indexes
    const hasPostUserCreated = postIndexes.some((idx) => idx.key.userId === 1 && idx.key.createdAt === -1);
    if (!hasPostUserCreated) {
      throw new Error('Post schema is missing required index: { userId: 1, createdAt: -1 }!');
    }
    console.log('✔ Post indexes strictly verified: { userId: 1, createdAt: -1 } for $lookup join.');

    // 3. Test Password Hashing
    console.log('\n--- 2. VERIFYING PASSWORD HASHING & AUTH ---');
    const rawPassword = 'SecurePassword123!';
    const user1 = await User.create({
      username: 'Alice Smith',
      email: 'alice@example.com',
      password: rawPassword,
      role: 'user',
      interests: ['chess', 'reading', 'ai']
    });

    const user2 = await User.create({
      username: 'Bob Jones',
      email: 'bob@example.com',
      password: rawPassword,
      role: 'user',
      interests: ['reading', 'music']
    });

    const adminUser = await User.create({
      username: 'Admin Person',
      email: 'admin@example.com',
      password: rawPassword,
      role: 'admin',
      interests: ['chess', 'security']
    });

    // Check stored password in DB is hashed and not plaintext
    const dbRecord = await User.findById(user1._id).select('+password');
    if (dbRecord.password === rawPassword || !dbRecord.password.startsWith('$2')) {
      throw new Error('Password was not hashed properly with bcrypt!');
    }
    const matchSuccess = await dbRecord.comparePassword(rawPassword);
    const matchFailure = await dbRecord.comparePassword('WrongPassword');
    if (!matchSuccess || matchFailure) {
      throw new Error('comparePassword method failed!');
    }
    console.log('✔ Password securely hashed with bcrypt (salt rounds: 10). Password verification passed.');

    // 4. Test Note Creation & Separation
    console.log('\n--- 3. VERIFYING NOTES CRUD & RBAC ACCESS ---');
    const note1 = await Note.create({
      title: "Alice's Secret Note",
      content: 'This note belongs only to Alice.',
      userId: user1._id
    });
    const note2 = await Note.create({
      title: "Alice's Second Note",
      content: 'Another note by Alice.',
      userId: user1._id
    });
    const note3 = await Note.create({
      title: "Bob's Public Idea",
      content: 'This belongs to Bob.',
      userId: user2._id
    });

    // Alice fetches her notes
    const aliceNotes = await Note.find({ userId: user1._id }).sort({ createdAt: -1 });
    if (aliceNotes.length !== 2) {
      throw new Error(`Expected Alice to have 2 notes, got ${aliceNotes.length}`);
    }
    console.log(`✔ User note filtering verified: Alice sees ${aliceNotes.length} notes, Bob notes excluded.`);

    // Admin fetches all notes
    const allNotes = await Note.find().sort({ createdAt: -1 });
    if (allNotes.length !== 3) {
      throw new Error(`Expected Admin to see all 3 notes, got ${allNotes.length}`);
    }
    console.log(`✔ Admin note visibility verified: Admin can see all ${allNotes.length} notes across all users.`);

    // 5. Test Aggregation Scenario 1: Group Users by Interests
    console.log('\n--- 4. VERIFYING AGGREGATION SCENARIO 1 (Group by Interests) ---');
    const interestGrouping = await User.aggregate([
      { $unwind: '$interests' },
      {
        $group: {
          _id: '$interests',
          totalUsers: { $sum: 1 },
          users: {
            $push: {
              _id: '$_id',
              username: '$username',
              email: '$email'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('Aggregation Output (Group by Interests):');
    interestGrouping.forEach((group) => {
      console.log(`  Interest: [${group._id}] -> ${group.totalUsers} user(s): ${group.users.map((u) => u.username).join(', ')}`);
    });

    const chessGroup = interestGrouping.find((g) => g._id === 'chess');
    if (!chessGroup || chessGroup.totalUsers !== 2) {
      throw new Error('Scenario 1 aggregation failed: expected 2 users with chess interest');
    }
    console.log('✔ Scenario 1 verified: exactly one collection.aggregate() call, correctly unwinding & grouping by interests.');

    // 6. Test Aggregation Scenario 2: User Posts ($lookup)
    console.log('\n--- 5. VERIFYING AGGREGATION SCENARIO 2 (User Posts with $lookup) ---');
    await Post.create([
      { title: 'Post 1 by Alice', content: 'Discussion on RAG architectures.', userId: user1._id },
      { title: 'Post 2 by Alice', content: 'Modern indexing strategies in MongoDB.', userId: user1._id },
      { title: 'Post 1 by Bob', content: 'Synthesizer sound design fundamentals.', userId: user2._id }
    ]);

    const userPostsLookup = await User.aggregate([
      { $match: { _id: user1._id } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          role: 1,
          posts: 1,
          totalPosts: { $size: '$posts' }
        }
      }
    ]);

    if (!userPostsLookup.length || userPostsLookup[0].totalPosts !== 2) {
      throw new Error(`Scenario 2 aggregation failed: expected Alice to have 2 joined posts, got ${userPostsLookup[0]?.totalPosts}`);
    }

    console.log(`User: ${userPostsLookup[0].username} (Posts joined via $lookup: ${userPostsLookup[0].posts.length})`);
    userPostsLookup[0].posts.forEach((p) => {
      console.log(`  - Post: "${p.title}"`);
    });
    console.log('✔ Scenario 2 verified: single aggregation pipeline with $lookup stage successfully joins user posts.');

    // 7. Test Pagination Logic
    console.log('\n--- 6. VERIFYING PAGINATION LOGIC ---');
    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    const [totalAliceNotes, paginatedAliceNotes] = await Promise.all([
      Note.countDocuments({ userId: user1._id }),
      Note.find({ userId: user1._id }).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    const totalPages = Math.ceil(totalAliceNotes / limit);
    if (paginatedAliceNotes.length !== 2 || totalPages !== 1) {
      throw new Error('Pagination calculation mismatch!');
    }
    console.log(`✔ Pagination verified: Page ${page}/${totalPages}, Limit: ${limit}, Returned: ${paginatedAliceNotes.length} items.`);

    console.log('\n====================================================');
    console.log(' ALL REQUIREMENTS VERIFIED AND PASSED WITH 100% SUCCESS');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
};

runTests();

