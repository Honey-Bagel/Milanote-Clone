import axios from 'axios';

export const getImages = (boardId) => {
	return axios.get(`/api/image/${boardId}`);
};

export const createImage = (image) => {
	return axios.post('/api/image', image);
};

export const updateImage = (id, updates) => {
	return axios.put(`/api/image/${id}`, updates);
};

export const deleteImage = (id) => {
	return axios.delete(`/api/image/${id}`);
}

