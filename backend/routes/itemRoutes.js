const express = require('express');
const { getItems, getItem, createItem, deleteItem, updateItem } = require('../controllers/itemController');
const { userVerification } = require('../middleware/AuthMiddleware');
const { authorizeBoardAccess } = require('../middleware/BoardMiddleware');

const router = express.Router();

router.use(userVerification);

// GET all items
router.get('/:boardId', getItems);

// GET a single item
router.get('/:id', getItem);

// CREATE a new item
router.post('/', authorizeBoardAccess, createItem);

// DELETE an item
router.delete('/:id', authorizeBoardAccess, deleteItem);

// UPDATE an item
router.put('/:id', authorizeBoardAccess, updateItem);

module.exports = router;
