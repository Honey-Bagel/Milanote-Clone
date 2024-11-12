const Board = require('../models/board');

module.exports = (io) => {
	io.on('connection', (socket) => {
		console.log('A user connected:', socket.id);

		socket.on('joinBoard', async ({ boardId, userId }) => {
					socket.join(boardId);
					console.log(`User ${socket.id} joined room for board ${boardId}`);

					socket.to(boardId).emit('userJoined', { boardId, userId: socket.id });
		});

		socket.on('leaveBoard', (boardId) => {
			console.log(`User left room for board ${boardId}`);

			socket.leave(boardId);
		});











		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
		})
	});
}