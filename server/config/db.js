import mongoose from 'mongoose';
import config from './env.js';

mongoose.set('strictQuery', true);

// Mongoose buffers queries while disconnected by default, which turns a dead
// database into hanging requests. Fail fast instead so the error handler can
// return a real 503.
mongoose.set('bufferCommands', false);

export async function connectDatabase() {
  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}

export default connectDatabase;
