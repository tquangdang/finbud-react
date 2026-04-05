import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { setIO } from './lib/socket.js';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
  },
});

setIO(io);

io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    socket.join(`user:${userId}`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
