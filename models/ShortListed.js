const mongoose = require('mongoose');

const ShortListedSchema = new mongoose.Schema({
    myUserId: { type: String, required: true },
    shortListUserId: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Index to speed up queries for interests
ShortListedSchema.index({ myUserId: 1, shortListUserId: 1 });

module.exports = mongoose.model('Short Listed', ShortListedSchema);
