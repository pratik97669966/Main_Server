// models/Interest.js
const mongoose = require('mongoose');

const InterestSchema = new mongoose.Schema({
    interestedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

// Indexing to speed up queries based on interested and target users
InterestSchema.index({ interestedUserId: 1, targetUserId: 1, status: 1 });

module.exports = mongoose.model('Interest', InterestSchema);
