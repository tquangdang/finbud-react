import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import configurePassport from './config/passport.js';
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notiRoutes from './routes/notiRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'finbud-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
};

if (process.env.MONGO_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60,
  });
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'lax';
}

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
configurePassport(app);

let cachedDb = null;
async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  cachedDb = await mongoose.connect(process.env.MONGO_URI);
  return cachedDb;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Finbud backend is running' });
});

app.post('/api/test-user', async (req, res) => {
  try {
    const user = await User.create({
      email: 'test@finbud.com',
      accountData: {
        username: 'testuser',
        password: 'password123',
        priviledge: 'user',
      },
      identityData: {
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
      },
    });
    res.json({ message: 'User created!', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notis', notiRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/users', userRoutes);

export default app;
