const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose v6+ uses defaults for useNewUrlParser and useUnifiedTopology
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    // Don't kill process immediately if local dev server wants to retry or fallback
    process.exit(1);
  }
};

module.exports = connectDB;
