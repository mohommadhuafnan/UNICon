import mongoose from 'mongoose';
import dns from 'dns';

// Ensure SRV records and Atlas cluster hosts resolve reliably across Windows networks and ISP DNS
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
  // Fallback to default system DNS if custom resolver setup fails
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniconnect');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

