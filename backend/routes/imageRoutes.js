const express = require('express');
const { getImages, deleteImage, createImage, updateImage } = require('../controllers/imageController');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 }});

const router = express.Router();

// GET all image
router.get('/:boardId', getImages);

// POST a new image
router.post('/', upload.single('image'), createImage);

// DELETE a image
router.delete('/:id', deleteImage);

// UPDATE a image
router.put('/:id', updateImage);

module.exports = router;