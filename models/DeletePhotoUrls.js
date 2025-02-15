const mongoose = require('mongoose');

const deletePhotoUrlsSchema = new mongoose.Schema({
    url: { type: String, required: true },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeletePhotoUrls', deletePhotoUrlsSchema);