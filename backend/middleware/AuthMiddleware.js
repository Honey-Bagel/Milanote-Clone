const User = require("../models/user");
const Board = require('../models/board');
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.userVerification = (req, res) => {

	const token = req.body.token;
	if(!token) {
		return res.json({ status: false });
	}
	jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
		if(err) {
			return res.json({status: false});
		} else {
			const user = await User.findById(data.id);
			if(user) return res.json({ status: true, user: user });
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
		return res.json({status: true});
	}
	return res.json({status: false});
}