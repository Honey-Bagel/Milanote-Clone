import axios from 'axios';

export const getNotes = (boardId) => {
	return axios.get(`/api/notes/${boardId}`);
};

export const createNote = (note) => {
	return axios.post('/api/notes', note);
};

export const updateNote = (id, updates) => {
	return axios.put(`/api/notes/${id}`, updates);
};

export const deleteNote = (id) => {
	return axios.delete(`/api/notes/${id}`);
}

