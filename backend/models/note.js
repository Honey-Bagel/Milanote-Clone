const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	type: {
		type: String,
		enum: ['text', 'image', 'link', 'drawing'],
		default: 'text'
	},
	color: {
		type: String
	},
	parent: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Note'
	},
	x: {
		type: Number,
		required: true,
	},
	y: {
		type: Number,
		required: true,
	},
	width: {
		type: Number,
		required: true
	},
	height: {
		type: Number,
		required: true
	}
});

module.exports = mongoose.model('Note', noteSchema);