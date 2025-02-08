const Item = require("./item");
const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
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
	},
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board'
    },
    position: {
        type: mongoose.Schema.Types.Mixed
    }
});

const Board = Item.discriminator("board", boardSchema);

module.exports = Board;