const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pay_unlock_db';
    const conn = await mongoose.connect(connStr, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[Database Error] MongoDB connection failed: ${err.message}`);
    // Keep application alive with warning so user can fix connection string if needed
    console.warn('[Database] Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
