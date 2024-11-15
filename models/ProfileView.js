// models/ProfileView.js
const mongoose = require('mongoose');

const ProfileViewSchema = new mongoose.Schema({
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, default: Date.now }
});

// Indexing to speed up queries based on viewer and viewed users
ProfileViewSchema.index({ viewerId: 1, viewedUserId: 1 });

module.exports = mongoose.model('ProfileView', ProfileViewSchema);
