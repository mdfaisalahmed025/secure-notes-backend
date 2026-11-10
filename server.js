require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Models to ensure indexes are registered
const User = require('./src/models/User');
const Note = require('./src/models/Note');
const Post = require('./src/models/Post');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Ensure all defined schema indexes are synced in MongoDB
    await Promise.all([
      User.init(),
      Note.init(),
      Post.init()
    ]);
    console.log('[Database] Schema indexes verified and synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`[Server] Secure Note-Taking API running on http://localhost:${PORT}`);
      console.log(`[Frontend] Access application UI at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server Error] Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

