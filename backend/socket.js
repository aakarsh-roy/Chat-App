import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

const userSocketMap = new Map(); // Map userId to socketId

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Store user socket mapping
    userSocketMap.set(socket.userId, socket.id);

    // Update user status to online
    User.findByIdAndUpdate(socket.userId, { 
      status: 'online',
      lastSeen: new Date() 
    }).exec();

    // Emit online status to all contacts
    socket.broadcast.emit('user-online', { userId: socket.userId });

    // Join user's personal room
    socket.join(socket.userId);

    // Join conversation rooms
    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle new message
    socket.on('send-message', (data) => {
      const { conversationId, message } = data;
      
      // Emit to all users in the conversation except sender
      socket.to(conversationId).emit('receive-message', message);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(conversationId).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping,
      });
    });

    // Handle message read
    socket.on('message-read', (data) => {
      const { conversationId, messageId } = data;
      socket.to(conversationId).emit('message-read-update', {
        messageId,
        userId: socket.userId,
      });
    });

    // Handle message delivered
    socket.on('message-delivered', (data) => {
      const { conversationId, messageId } = data;
      socket.to(conversationId).emit('message-delivered-update', {
        messageId,
        userId: socket.userId,
      });
    });

    // Handle video call signals
    socket.on('call-user', (data) => {
      const { to, offer, callType } = data;
      const toSocketId = userSocketMap.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('incoming-call', {
          from: socket.userId,
          fromUser: socket.user,
          offer,
          callType,
        });
      }
    });

    socket.on('call-answer', (data) => {
      const { to, answer } = data;
      const toSocketId = userSocketMap.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('call-answered', {
          from: socket.userId,
          answer,
        });
      }
    });

    socket.on('ice-candidate', (data) => {
      const { to, candidate } = data;
      const toSocketId = userSocketMap.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('ice-candidate', {
          from: socket.userId,
          candidate,
        });
      }
    });

    socket.on('end-call', (data) => {
      const { to } = data;
      const toSocketId = userSocketMap.get(to);
      
      if (toSocketId) {
        io.to(toSocketId).emit('call-ended', {
          from: socket.userId,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove from socket map
      userSocketMap.delete(socket.userId);

      // Update user status to offline
      User.findByIdAndUpdate(socket.userId, { 
        status: 'offline',
        lastSeen: new Date() 
      }).exec();

      // Emit offline status to all contacts
      socket.broadcast.emit('user-offline', { 
        userId: socket.userId,
        lastSeen: new Date() 
      });
    });
  });

  return io;
};

export const getReceiverSocketId = (userId) => {
  return userSocketMap.get(userId);
};
