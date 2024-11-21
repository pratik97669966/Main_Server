const mongoose = require('mongoose');

const MyContactsSchema = new mongoose.Schema({
    myUserId: { type: String, required: true },
    contactUserId: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Index to speed up queries for interests
MyContactsSchema.index({ myUserId: 1, contactUserId: 1 });

module.exports = mongoose.model('My Contacts', MyContactsSchema);
