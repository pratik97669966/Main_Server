// models/Block.js
const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
    blockerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who is blocking
    blockedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user being blocked
    blockedAt: { type: Date, default: Date.now }
});

// Add a compound index to prevent duplicate blocks by the same user
BlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

module.exports = mongoose.model('Block', BlockSchema);
