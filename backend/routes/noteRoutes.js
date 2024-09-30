const express = require('express');
const { getNotes, getNote, createNote, deleteNote, updateNote } = require('../controllers/noteController');

const router = express.Router();

// GET all notes
router.get('/', getNotes);

// GET a single note
router.get('/:id', getNote);

// POST a new note
router.post('/', createNote);

// DELETE a note
router.delete('/:id', deleteNote);

// UPDATE a note
router.patch('/:id', updateNote);

module.exports = router;