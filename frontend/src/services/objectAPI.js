import axios from 'axios';
import socket from '../utils/socket';

export const getObjects = (boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	return axios.get(`/api/objects/${boardId}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
};

export const createObject = async (boardId, note) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	const response = await axios.post('/api/objects', {
		note
	}, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
	
	if(response.status === 201) {
		const note = response.data;
		console.log('respNote', note);
		socket.emit('createObject', { boardId, note});
	}
	return response;
};

export const updateObject = async (id, boardId, updates) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	const response = await axios.put(`/api/objects/${id}`, {
		updates: updates
	}, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});


	if(response.status === 200) {
		socket.emit('updateObject', {boardId, id, updates});
	}
	return response;
};

export const deleteObject = async (id, boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	const response = await axios.delete(`/api/objects/${id}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});

	if(response.status === 200) {
		socket.emit('deleteObject', {boardId, id});
	}
	return response;
}

