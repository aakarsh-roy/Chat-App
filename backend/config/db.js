import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const options = {
      // Connection pooling for scalability
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 5, // Minimum number of connections in the pool
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      family: 4, // Use IPv4, skip trying IPv6
      
      // Automatic index creation (disable in production for better performance)
      autoIndex: process.env.NODE_ENV !== 'production',
      
      // Connection management
      maxIdleTimeMS: 10000, // Close inactive connections after 10 seconds
      retryWrites: true, // Retry failed writes
      retryReads: true, // Retry failed reads
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool Size: ${options.maxPoolSize}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`Mongoose connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
