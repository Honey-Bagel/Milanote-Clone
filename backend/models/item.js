const mongoose = require('mongoose');

const BaseItemSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["board", "note"],
    },
},
{ 
    timestamps: true, discriminatorKey: "type"
}
);

module.exports = mongoose.model("Item", BaseItemSchema);