const Board = require('../models/board');

module.exports = (io) => {
	io.on('connection', (socket) => {
		console.log('A user connected:', socket.id);

		socket.on('joinBoardRoom', async ({ boardId, userId }) => {
				const board = await Board.findById(boardId);
				if(board && (board.owner === userId || board.collaborators.includes(userId))) {
					socket.join(boardId);
					console.log(`User ${userId} joined room for board ${boardId}`);
				} else {
					socket.emit('error', 'Access denied');
				}
		});

		socket.on('leaveBoardRoom', (boardId) => {
			socket.leave(boardId);
			console.log(`User left room for board ${boardId}`);
		});











		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
		})
	});
}