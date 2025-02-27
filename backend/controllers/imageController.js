const Image = require('../models/image');
const mongoose = require('mongoose');
const uuidv4 = require("uuid").v4;

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
const uploadImage = async (req, res) => {
	try {
		const { bucket } = await import("../util/firebase.mjs");
        if(!req.file) return res.status(400).send("No file uploaded");

        const { boardId } = req.body;
        const fileName = `images/${uuidv4()}-${req.file.originalname}`;
        const fileRef = bucket.file(fileName);

        const stream = fileRef.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        stream.on("error", (err) => {
            console.error(err);
            res.status(500).send(err);
        });

        stream.on("finish", async () => {
            await fileRef.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

            const newImage = new Image({ src: imageUrl, boardId })
            await newImage.save();

            res.status(201).json({ message: "Image uploaded", newImage });
        });

        stream.end(req.file.buffer);

	} catch (err) {
        console.log(err);
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

module.exports = { getImages, uploadImage, deleteImage, updateImage };