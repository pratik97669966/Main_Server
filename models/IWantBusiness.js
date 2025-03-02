const mongoose = require('mongoose');

const IwantBusinessSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerUid: { type: String, required: true },
    customerMobile: { type: String, required: true },
    requestNote: { type: String, required: true },
    date: { type: Date, default: Date.now },

});

IwantBusinessSchema.index({ customerMobile: 1 });

module.exports = mongoose.model('I Want Business', IwantBusinessSchema);
