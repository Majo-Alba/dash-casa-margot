const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('[MongoDB] MONGO_URI not set. Server will run with Google Sheet data only.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('[MongoDB] connected');
  } catch (error) {
    console.error('[MongoDB] connection error:', error.message);
  }
};
