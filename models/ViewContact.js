const mongoose = require('mongoose');

const ViewContactSchema = new mongoose.Schema({
    viewContactUserId: { type: String, required: true },
    viewContactTargetUserId: { type: String, required: true },
    viewContactStatus: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Index to speed up queries for interests
ViewContactSchema.index({ viewContactUserId: 1, viewContactTargetUserId: 1 });

module.exports = mongoose.model('View Contact', ViewContactSchema);
