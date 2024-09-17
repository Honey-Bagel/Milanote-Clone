const mongoose = require('mognoose');

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
	}
});

module.exports = mongoose.model('Note', noteSchema);