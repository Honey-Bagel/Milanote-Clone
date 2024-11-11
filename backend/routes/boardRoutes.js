const express = require('express');
const { getBoard, getBoards, createBoard, deleteBoard, updateBoard } = require('../controllers/boardController');
const { checkBoardAccess } = require('../middleware/BoardMiddleware');

const router = express.Router();

// GET a single board
router.get('/:id', checkBoardAccess, getBoard);

// GET all the boards
router.get('/', getBoards);

// POST a new board
router.post('/', createBoard);

// DELETE a board
router.delete('/:id', deleteBoard);

// UPDATE a board
router.put('/:id', updateBoard);

module.exports = router;