import axios from 'axios';
import socket from '../utils/socket';

export const getNotes = (boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	return axios.get(`/api/notes/${boardId}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
};

export const createNote = async (note, boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	const response = await axios.post('/api/notes', {
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
		socket.emit('createNote', { boardId, note});
	}
	return response;
};

export const updateNote = async (id, boardId, updates) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	const response = await axios.put(`/api/notes/${id}`, {
		updates: updates
	}, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});


	if(response.status === 200) {
		socket.emit('updateNote', {boardId, id, updates});
	}
	return response;
};

export const deleteNote = async (id, boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	const response = await axios.delete(`/api/notes/${id}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});

	if(response.status === 200) {
		socket.emit('deleteNote', {boardId, id});
	}
	return response;
}

