require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const cors = require("cors");
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const boardRoutes = require('./routes/boardRoutes');
const noteRoutes = require('./routes/noteRoutes');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { MONGO_URL, PORT } = process.env;

const app = express();
const server = createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect(MONGO_URL);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
	origin: ["http://localhost:3001"],
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true
}));

// Routes
app.use('/api/boards', boardRoutes); // handle user boards
app.use('/api/notes', noteRoutes); // handle notes
app.use('/api/auth', authRoutes); // user authentication

// Handle real time interactivity using socket.io
io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('chat message', (msg) => {
		io.emit('chat message', msg);
	});
});

server.listen(PORT, () => {
	console.log('Server listening on port ', process.env.PORT);
});