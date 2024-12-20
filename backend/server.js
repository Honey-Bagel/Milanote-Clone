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
const imageRoutes = require('./routes/imageRoutes');
const cookieParser = require('cookie-parser');
const { MONGO_URL, PORT } = process.env;
const { initializeSocket } = require('./util/socketSingleton');

const app = express();
const server = createServer(app);
// const io = new Server(server, {
// 	cors: {
// 		origin: "http://localhost:3001",
// 		methods: ["GET", "POST"]
// 	}
// });
initializeSocket(server);
const io = require('./util/socketSingleton').getSocketInstance();

// Connect to MongoDB
mongoose.connect(MONGO_URL);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
	//origin: ["http://localhost:3001"],
	origin: '*',
	methods: ["GET", "POST", "PUT", "DELETE"],
	credentials: true
}));

// Error Handling
app.use((err, req, res, next) => {
	console.error(err.stack); // Log error details for debugging
  
	// Customize the response based on error type
	res.status(err.status || 500).json({
	  message: err.message || 'Internal Server Error',
	  details: err.details || null,
	});
  });

// Routes
app.use('/api/boards', boardRoutes); // handle user boards
app.use('/api/notes', noteRoutes); // handle notes
app.use('/api/auth', authRoutes); // user authentication
app.use('/api/image', imageRoutes) // handle images

//increase payload limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Handle real time interactivity using socket.io.
require('./util/socket')(io);

server.listen(PORT, () => {
	console.log('Server listening on port ', process.env.PORT);
});