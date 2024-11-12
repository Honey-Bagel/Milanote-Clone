const Note = require('../models/note');
const mongoose = require('mongoose');
const { getSocketInstance } = require('../util/socketSingleton');

// get ALL User Notes
const getNotes = async (req, res) => {
	const { boardId } = req.params;
	if(!boardId) {
		console.log('no board found')
		return res.status(401).json({error: 'Board id required'});
	}


	const notes = await Note.find({ board: boardId });

	res.status(200).json(notes)
}

// Get a note
const getNote = async (req, res) => {
	const { id } = req.params;

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such note'});
	}

	const note = await Note.findById(id);

	if(!note) {
		return res.status(404).json({erorr: 'No such note'})
	}

	res.status(200).json(note);
}

// Create a new Note
const createNote = async (req, res) => {
	const { note, boardId } = req.body;
	try {
		console.log(note);
		const noteObject = new Note(note);
		await noteObject.save();
		
		res.status(201).json(noteOjbect);
	} catch (err) {
		res.status(500).json({error: 'Failed to create note'});
	}
}

// Delete a note
const deleteNote = async (req, res) => {
	const { id } = req.params;
	const { boardID } = req.body;

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such note'});
	}

	const note = await Note.findOneAndDelete({_id: id});

	if(!note) {
		return res.status(404).json({error: 'no such'})
	}

	res.status(200).json(note);
}

const updateNote = async (req, res) => {
	const io = getSocketInstance();
	const { id } = req.params;
	const { updates } = req.body;
	const boardId = req.headers['board-id'];

	io.to(boardId).emit('noteUpdated', { id, updates});

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such note'});
	}

	const note = await Note.findByIdAndUpdate({_id: id}, {
		...updates
	});

	if(!note) {
		return res.status(404).json({error: 'No such note'});
	}
	res.status(200).json(note);
}

module.exports = { getNotes, getNote, createNote, deleteNote, updateNote };