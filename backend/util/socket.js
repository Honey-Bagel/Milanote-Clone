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

		socket.on('updateNote', ({boardId, id, updates}) => {
			console.log(`User ${socket.id} updated note ${id} on board ${boardId}`);

			socket.to(boardId).emit('noteUpdated', {id, updates});
		})

		socket.on('createNote', ({boardId, note}) => {
			console.log(`User ${socket.id} create note ${note._id} on board ${boardId}`)

			socket.to(boardId).emit('noteCreated', { note });
		})

		socket.on('deleteNote', ({boardId, id}) => {
			console.log(`User ${socket.id} deleted note ${id} on board ${boardId}`)
			socket.to(boardId).emit('noteDeleted', { id });
		})











		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
		})
	});
}