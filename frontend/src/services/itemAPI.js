import axios from 'axios';
import socket from '../utils/socket';

export const getItems = (boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	return axios.get(`/api/items/${boardId}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
};

export const createItem = async (boardId, object) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

    console.log(boardId)

	const response = await axios.post('/api/items', {
		object
	}, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
	
	if(response.status === 201) {
		const object = response.data;
		console.log('respItem', object);
		socket.emit('createItem', { boardId, object});
	}
	return response;
};

export const updateItem = async (id, boardId, route, updates) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;


	const response = await axios.put(`/api/${route}/${id}`, {
		updates: updates
	}, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});

	if(response.status === 200) {
		socket.emit('updateItem', {boardId, id, updates});
	}
	return response;
};

export const deleteItem = async (id, boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	const response = await axios.delete(`/api/items/${id}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});

	if(response.status === 200) {
		socket.emit('deleteItem', {boardId, id});
	}
	return response;
}

