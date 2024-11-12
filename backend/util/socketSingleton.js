let io;

const initializeSocket = (server) => {
	io = require('socket.io')(server);
};

const getSocketInstance = () => {
	if(!io) {
		throw new Error('Socket.io has not been initialized');
	}
	return io;
};

module.exports = { initializeSocket, getSocketInstance };