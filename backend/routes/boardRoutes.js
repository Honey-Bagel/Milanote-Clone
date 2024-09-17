const express = require('express');
const { getBoard, createBoard } = require('../controllers/boardController');

const router = express.Router();

// GET a single board
router.get('/:id', getBoard);

// POST a new board
router.post('/', createBoard);

module.exports = router;