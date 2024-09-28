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
	position: {
		type: mongoose.Schema.Types.Mixed,
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