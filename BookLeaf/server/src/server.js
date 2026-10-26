require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');

const connectDB = async () => {
  const db = require('./config/db');
  await db();
};

const swaggerDocument = require('./docs/swagger');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const ticketRoutes = require('./routes/tickets');
const statsRoutes = require('./routes/stats');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join:user', (userEmail) => {
    if (userEmail) {
      socket.join(`user_${userEmail.toLowerCase()}`);
    }
  });

  socket.on('join:ticket', (ticketId) => {
    if (ticketId) {
      socket.join(`ticket_${ticketId}`);
    }
  });

  socket.on('leave:ticket', (ticketId) => {
    if (ticketId) {
      socket.leave(`ticket_${ticketId}`);
    }
  });

  socket.on('typing:start', ({ ticketId, userName, userRole }) => {
    socket.to(`ticket_${ticketId}`).emit('typing:status', {
      ticketId,
      userName,
      userRole,
      isTyping: true
    });
  });

  socket.on('typing:stop', ({ ticketId }) => {
    socket.to(`ticket_${ticketId}`).emit('typing:status', {
      ticketId,
      isTyping: false
    });
  });

  socket.on('disconnect', () => {});
});

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'LeafDesk Backend API',
    company: 'BookLeaf Publishing',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/stats', statsRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

app.use((err, req, res, next) => {
  console.error('[Error]:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
