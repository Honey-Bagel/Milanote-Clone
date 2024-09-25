const Note = require('../models/note');
const mongoose = require('mongoose');

// get ALL User Notes
const getNotes = async (req, res) => {

	const notes = await Note.find({})

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
	try {
		const note = new Note(req.body);
		await note.save();
		res.status(201).json(note);
	} catch (err) {
		res.status(500).json({error: 'Failed to create note'});
	}
}

// Delete a note
const deleteNote = async (req, res) => {
	const { id } = req.params;

	if(!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).json({error: 'No such note'});
	}

	const note = await Note.findOneAndDelete({_id: id});

	if(!note) {
		return res.status(404).json({error: 'no such'})
	}

	res.status(200).json(note);
}

module.exports = { getNotes, getNote, createNote, deleteNote};