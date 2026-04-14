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

// Create a connection to the socket
io.on('connection', (socket) => {
  // Register the user to the socket
  socket.on('register', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} connected to the socket`);
  });

  // Unregister the user from the socket
  socket.on('unregister', (userId) => {
    socket.leave(`user:${userId}`);
    console.log(`User ${userId} disconnected from the socket`);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
