import axios from 'axios';

export const updateBoard = (boardId, updates) => {
	return axios.put(`/api/boards/${boardId}`, updates);
}

export const fetchBoard = (boardId) => {
	const user = JSON.parse(localStorage.getItem('user'));
	if(!user) return;
	const token = user.token;
	if(!token) return;

    return axios.get(`/api/boards/${boardId}`, {
		headers: { 
			Authorization: `Bearer ${token}`,
			'Board-Id': boardId
		}
	});
}