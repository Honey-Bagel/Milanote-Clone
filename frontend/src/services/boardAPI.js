import axios from 'axios';

export const updateBoard = (boardId, updates) => {
	return axios.put(`/api/boards${boardId}`, updates);
}