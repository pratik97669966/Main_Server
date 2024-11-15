const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
    blockerId: { type: String, required: true },
    blockedUserId: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Index to speed up blocked user counts
BlockSchema.index({ blockerId: 1, blockedUserId: 1 });

module.exports = mongoose.model('Block', BlockSchema);
