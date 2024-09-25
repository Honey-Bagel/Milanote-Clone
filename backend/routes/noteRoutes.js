const express = require('express');
const { getNotes, getNote, createNote, deleteNote } = require('../controllers/noteController');

const router = express.Router();

// GET all notes
router.get('/', getNotes);

// GET a single board
router.get('/:id', getNote);

// POST a new board
router.post('/', createNote);

// DELETE a board
router.delete('/:id', deleteNote);

module.exports = router;