const express = require('express');
const { getNotes, getNote, createNote, deleteNote, updateNote } = require('../controllers/noteController');
const { userVerification } = require('../middleware/AuthMiddleware');
const { authorizeBoardAccess } = require('../middleware/BoardMiddleware');

const router = express.Router();

router.use(userVerification);

// GET all notes
router.get('/:boardId', getNotes);

// GET a single note
router.get('/:id', getNote);

// POST a new note
router.post('/', authorizeBoardAccess, createNote);

// DELETE a note
router.delete('/:id', authorizeBoardAccess, deleteNote);

// UPDATE a note
router.put('/:id', authorizeBoardAccess, updateNote);

module.exports = router;