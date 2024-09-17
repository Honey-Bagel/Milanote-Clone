require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const boardRoutes = require('./routes/boardRoutes');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Middleware
app.use(express.json());

// Routes
app.use('/boards', boardRoutes);

app.get('/', (req, res) => {
	
})

io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('chat message', (msg) => {
		io.emit('chat message', msg);
	});
});

server.listen(process.env.PORT, () => {
	console.log('Server listening on port ', process.env.PORT);
})