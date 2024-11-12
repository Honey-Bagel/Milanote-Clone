import axios from 'axios';

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

export const createNote = (note, boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	return axios.post('/api/notes', {
		note
	}, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
};

export const updateNote = (id, boardId, updates) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	return axios.put(`/api/notes/${id}`, {
		updates: updates
	}, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
};

export const deleteNote = (id, boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

	return axios.delete(`/api/notes/${id}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId,
		}
	});
}

