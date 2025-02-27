import axios from 'axios';

export const getImages = (boardId) => {
	return axios.get(`/api/image/${boardId}`);
};

export const createImage = (formData) => {
	return axios.post('/api/image', formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
};

export const updateImage = async (id, updates) => {
	return await axios.put(`/api/image/${id}`, updates);
};

export const deleteImage = (id) => {
	return axios.delete(`/api/image/${id}`);
}

