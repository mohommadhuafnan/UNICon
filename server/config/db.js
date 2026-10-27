import mongoose from 'mongoose';
import dns from 'dns';

// Only apply custom DNS resolver on local Windows development where local ISPs block Atlas SRV lookup
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const origLookup = dns.lookup;
    dns.lookup = (hostname, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (hostname && (hostname.includes('mongodb.net') || hostname.includes('amazonaws.com'))) {
        resolver
          .resolve4(hostname)
          .then((addresses) => {
            if (options && options.all) {
              callback(
                null,
                addresses.map((addr) => ({ address: addr, family: 4 }))
              );
            } else {
              callback(null, addresses[0], 4);
            }
          })
          .catch(() => origLookup(hostname, options, callback));
      } else {
        origLookup(hostname, options, callback);
      }
    };
  } catch {
    // Fallback to default system DNS
  }
}

let cachedConnection = null;

export const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniconnect';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    cachedConnection = conn;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    throw error;
  }
};

export default connectDB;
