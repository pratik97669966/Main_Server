const mongoose = require('mongoose');

const InterestSchema = new mongoose.Schema({
    interestedUserId: { type: String, required: true },
    targetUserId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' }
});

// Index to speed up queries for interests
InterestSchema.index({ interestedUserId: 1, targetUserId: 1 });

module.exports = mongoose.model('Interest', InterestSchema);
