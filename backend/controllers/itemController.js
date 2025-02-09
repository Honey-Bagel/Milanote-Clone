const Item = require("../models/item");
const mongoose = require('mongoose');
const { getSocketInstance } = require("../util/socketSingleton");
const Note = require("../models/note");
const Board = require("../models/board");

// GET all items
const getItems = async (req, res) => {
    const { boardId } = req.params;
    if(!boardId) {
        console.log('no board found');
        return res.status(401).json({ error: 'Board id required' });
    }

    const items = await Item.find({ board: boardId});

    res.status(200).json(items);
};

// GET a single item
const getItem = async (req, res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid item.' });
    }

    const item = await Item.findById(id);

    if(!item) {
        return res.status(404).json({ error: 'Not a valid item.' });
    }

    res.status(200).json(item);
};

// CREATE an item
const createItem = async (req, res) => {
    const { type, ...data } = req.body.object;
    
    try{
        let item = null;
        switch(type) {
            case "note":
                item = await new Note(data).save();
                break;
            case "board":
                item = await new Board(data).save();
                break;
        }
        if(item) {
            res.status(201).json(item);
        }
    } catch (e) {
        res.status(500).json({ error: 'Failed to create item.' });
    }
};

// DELETE an Item
const deleteItem = async (req, res) => {
    const { id } = req.params;
    const boardId = req.headers['board-id'];

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid item.' });
    }

    const item = await Item.findOneAndDelete({ _id: id });

    if(!item) {
        return res.status(404).json({ error: 'Not a valid item' });
    }

    res.status(200).json(item);
};

// UPDATE an item
const updateItem = async (req, res) => {
    const { id } = req.params;
    const { updates } = req.body;
    
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Not a valid Item.' });
    }

    const item = await Item.findByIdAndUpdate({ _id: id }, {
        ...updates
    });


    if(!item) {
        return res.status(404).json({ error: 'Not a valid Item.' });
    }

    res.status(200).json(item);
};

module.exports = { getItems, getItem, createItem, deleteItem, updateItem };