const mongoose = require('mongoose');

const BaseItemSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["board", "note", "image"],
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    color: {
        type: String,
    }
},
{ 
    timestamps: true, discriminatorKey: "type"
}
);

module.exports = mongoose.model("Item", BaseItemSchema);