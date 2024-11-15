const mongoose = require('mongoose');
const ProfileViewSchema = new mongoose.Schema({
    viewerId: { type: String, required: true },
    viewedUserId: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ProfileView', ProfileViewSchema);
