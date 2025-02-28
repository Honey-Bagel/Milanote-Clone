const mongoose = require('mongoose');
const Item = require('./item');

const imageSchema = new mongoose.Schema({
	board: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Board',
		required: true,
	},
	src: {
		type: String, required: true,
	},
	position: {
            type: mongoose.Schema.Types.Mixed
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

const Image = Item.discriminator("image", imageSchema);

module.exports = Image;