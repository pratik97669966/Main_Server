// models/ProfileView.js
const mongoose = require('mongoose');

const ProfileViewSchema = new mongoose.Schema({
    viewerId: { type: String, required: true },
    viewedUserId: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Indexing to speed up queries based on viewer and viewed users
ProfileViewSchema.index({ viewerId: 1, viewedUserId: 1 });

module.exports = mongoose.model('ProfileView', ProfileViewSchema);
