const Board = require('../models/board');
const mongoose = require('mongoose');

// get ALL boards
const getBoards = async (req, res) => {
	const boards = await Board.find({});

	res.status(200).json(boards);
}

// get a board
const getBoard = async (req, res) => {
	const board = req.board;

	res.status(200).json(board);
}

// create a new board
const createBoard = async (req, res) => {
	try {
		const board = new Board(req.body);
		await board.save();
		res.status(201).json(board);
	  } catch (err) {
		res.status(500).json({ error: 'Failed to create board' });
	  }
}

// delete a board
const deleteBoard = async (req, res) => {
	const { id } = req.params;

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such board'});
	}

	const board = await Board.findOneAndDelete({_id: id});

	if(!board) {
		return res.status(404).json({error: 'no such board'});
	}

	res.status(200).json(board);
}

// update a board
const updateBoard = async (req, res) => {
	const { id } = req.params;

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such board'});
	}

	const board = await Board.findByIdAndUpdate({_id: id}, {
		...req.body
	});

	if(!board) {
		return res.status(404).json({error: 'No such board'});
	}
	res.status(200).json(workout);
}

module.exports = { getBoard, getBoards , createBoard, deleteBoard };