const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
	boardId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true,
	},
	src: {
		type: String, required: true,
	},
	left: {
		type: Number,
		default: 0,
	},
	top: {
		type: Number,
		default: 0,
	},
	width: {
		type: Number,
		default: 100,
	},
	height: {
		type: Number,
		default: 100,
	},
	scaleX: {
		type: Number,
		default: 1,
	},
	scaleY: {
		type: Number,
		default: 1,
	},
	angle: {
		type: Number,
		default: 0,
	},
});

module.exports = mongoose.model('Image', imageSchema)