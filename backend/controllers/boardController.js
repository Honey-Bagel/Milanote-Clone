const Board = require('../models/board');
const mongoose = require('mongoose');

// get ALL boards

// get a board
const getBoard = async (req, res) => {
	try {
		const board = await Board.findById(req.params.id).populate('notes collaborators');
		res.json(board);
	  } catch (err) {
		res.status(404).json({ error: 'Board not found' });
	  }
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

// update a board

module.exports = { getBoard, createBoard };