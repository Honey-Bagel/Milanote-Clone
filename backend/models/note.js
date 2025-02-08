const Item = require("./item");
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
	},
	board: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true
	}
});

const Note = Item.discriminator("note", noteSchema);

module.exports = Note;