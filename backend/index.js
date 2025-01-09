// server/index.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create a server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Frontend URL
    methods: ["GET", "POST"],
  },
});

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/socket-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Message schema and model
const messageSchema = new mongoose.Schema({
  username: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

let videoQueue = [];

// Socket.IO logic
io.on('connection', async (socket) => {


    // Send current video queue to the client
    socket.emit('videoQueue', videoQueue);

    // Add a new video to the queue
    socket.on('addVideo', (video) => {
      videoQueue.push({ ...video, votes: 0 });
      io.emit('videoQueue', videoQueue);
    });




  // Handle upvotes
  socket.on('upvote', (videoId) => {
    const video = videoQueue.find((v) => v.id === videoId);
    if (video) {
      video.votes += 1;
      io.emit('videoQueue', videoQueue);
    }
  });


    // Handle downvotes
    socket.on('downvote', (videoId) => {
      const video = videoQueue.find((v) => v.id === videoId);
      if (video) {
        video.votes -= 1;
        io.emit('videoQueue', videoQueue);
      }
    });


  console.log('User connected:', socket.id);

  const messages = await Message.find() 

  // Emit previous messages
  console.log('loading previous messages and sending to the client>>>>');
  
  socket.emit('loadMessages', messages)
    // Message.find().then((messages) => socket.emit('loadMessages', messages));
  
    // Listen for new messages
  socket.on('newMessage', async (message) => {
    const savedMessage = await Message.create(message);
    console.log('message sent from client>>>', message);
    
    io.emit('broadcastMessage', savedMessage); // Broadcast to all connected clients
  });


    // Listen for typing event
    socket.on('typing', (username) => {
      socket.broadcast.emit('userTyping', `${username} is typing...`);
    });


      // Listen for stop typing event
  socket.on('stopTyping', () => {
    socket.broadcast.emit('userTyping', ''); // Clear typing indicator
  });


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
