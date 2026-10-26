const mongoose = require('mongoose');

function sanitizeUri(rawUri) {
  if (!rawUri) return '';
  let cleaned = rawUri.trim();
  cleaned = cleaned.replace(/^(MONGODB_URI|MONGO_URI)=\s*/i, '');
  cleaned = cleaned.replace(/^['"](.*)['"]$/, '$1');
  return cleaned;
}

const connectDB = async () => {
  const primaryUri = sanitizeUri(process.env.MONGODB_URI || process.env.MONGO_URI);
  const fallbackUri = 'mongodb://127.0.0.1:27017/leafdesk';
  const targetUri = primaryUri || fallbackUri;

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    if (primaryUri && primaryUri !== fallbackUri) {
      try {
        const localConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 4000
        });
        console.log(`Connected to local MongoDB: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localErr) {
        console.error(`Local MongoDB fallback failed: ${localErr.message}`);
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;
