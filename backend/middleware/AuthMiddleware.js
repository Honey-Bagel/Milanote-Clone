const User = require("../models/user");
const Board = require('../models/board');
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.userVerification = async (req, res, next) => {
	const authHeader = req.headers.authorization;

	if(!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ status: false, message: 'Unauthorized' });
	}

	const token = authHeader.split(' ')[1];

	if(!token) {
		return res.json({ status: false });
	}
	jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
		if(err) {
			console.error(err);
			return res.json({status: false});
		} else {
			const user = await User.findById(data.id);
			if(user) {
				req.user = user;
				next();
			}
			else return res.json({ status: false });
		}
	})
}

module.exports.boardVerification = async (req, res) => {
	const userId = req.body.userId;
	const { id } = req.params;

	const board = await Board.findById(id);
	if(!board) {
		console.log('no board')
		return res.json({status: false});
	}

	if(board.owner == userId || board.collaborators.includes(userId)) {
		console.log('true')
		return res.json({status: true});
	}
	console.log('false')
	return res.json({status: false});
}