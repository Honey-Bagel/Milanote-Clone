const express = require('express');
const { getBoard, getBoards, createBoard, deleteBoard, updateBoard } = require('../controllers/boardController');
const { authorizeBoardAccess } = require('../middleware/BoardMiddleware');
const { userVerification } = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(userVerification);

// GET a single board
router.get('/:id', authorizeBoardAccess, getBoard);

// GET all the boards
router.get('/', getBoards);

// POST a new board
router.post('/', createBoard);

// DELETE a board
router.delete('/:id', authorizeBoardAccess, deleteBoard);

// UPDATE a board
router.put('/:id', authorizeBoardAccess, updateBoard);

module.exports = router;