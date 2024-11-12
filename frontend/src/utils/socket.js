import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
	reconnectionAttempts: 5,
  	timeout: 10000,
  	transports: ['websocket'],
});

// Connection and error handling

socket.on('connect', () => {
	console.log('Connected to the server.');
});

socket.on('disconnect', (reason) => {
	console.log(`Disconnected: ${reason}`);
	if(reason === 'io server disconnect') {
		socket.connect();
	}
});

socket.on('reconnect_attempt', () => {
	console.log('Attempting to reconnect...');
});

socket.on('connect_error', (e) => {
	console.error('Socket connection error:', e);
});


socket.on('noteUpdated', (data) => {
	console.log('note updated:', data);
})
export default socket;