const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	notes: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Note'
	}],
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	collaborators: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}],
	root: {
		type: Boolean
	}
});

module.exports = mongoose.model('Board', boardSchema);