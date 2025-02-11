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
			console.log(`User ${socket.id} left room for board ${boardId}`);

			socket.leave(boardId);
		});

		socket.on('cursorMove', ({ boardId, cursorPosition }) => {
			socket.to(boardId).emit('updateCursor', cursorPosition);
		})

		socket.on('updateItem', ({boardId, id, updates}) => {
			console.log(`User ${socket.id} updated note ${id} on board ${boardId}`);

			socket.to(boardId).emit('itemUpdated', {id, updates});
		})

		socket.on('createItem', ({boardId, note}) => {
			console.log(`User ${socket.id} create note ${note._id} on board ${boardId}`)

			socket.to(boardId).emit('itemCreated', { note });
		})

		socket.on('deleteItem', ({boardId, id}) => {
			console.log(`User ${socket.id} deleted note ${id} on board ${boardId}`)
			socket.to(boardId).emit('itemDeleted', { id });
		})











		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
		})
	});
}