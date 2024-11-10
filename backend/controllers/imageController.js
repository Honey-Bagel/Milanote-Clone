const Image = require('../models/image');
const mongoose = require('mongoose');

// get ALL User images
const getImages = async (req, res) => {
	const { boardId } = req.params;
	if(!boardId) {
		console.log('no board found')
		return res.status(401).json({error: 'Board id required'});
	}


	const images = await Image.find({ board: boardId });

	res.status(200).json(images)
}

// Create a new image
const createImage = async (req, res) => {
	try {
		if(!req.file) res.status(500).json({ error: 'Failed to create image'});

		const imageBuffer = req.file.buffer.toString('base64');
		
		console.log(req.body);
		const image = new Image(req.body);
		await image.save();
		res.status(201).json(image);
	} catch (err) {
		res.status(500).json({error: 'Failed to create image'});
	}
}

// Delete a image
const deleteImage = async (req, res) => {
	const { id } = req.params;

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such image'});
	}

	const image = await Image.findOneAndDelete({_id: id});

	if(!image) {
		return res.status(404).json({error: 'no such'})
	}

	res.status(200).json(image);
}

const updateImage = async (req, res) => {
	const { id } = req.params;

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such image'});
	}

	const image = await Image.findByIdAndUpdate({_id: id}, {
		...req.body
	});

	if(!image) {
		return res.status(404).json({error: 'No such image'});
	}
	res.status(200).json(image);
}

module.exports = { getImages, createImage, deleteImage, updateImage };