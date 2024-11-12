import axios from 'axios';

export const updateBoard = (boardId, updates) => {
	return axios.put(`/api/boards/${boardId}`, updates);
}

export const fetchUserId = (email) => {
	return axios.post('/api/auth/email', {
		email: email
	});
};