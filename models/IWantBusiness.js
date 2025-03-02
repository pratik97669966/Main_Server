const mongoose = require('mongoose');

const IwantBusinessSchema = new mongoose.Schema({
    businessNumber: { type: String, required: true },
    businessName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    requestNote: { type: String, required: true },
    businessList: [{
        customerName: { type: String, required: true },
        customerUid: { type: String, required: true },
        customerMobile: { type: String, required: true },
    }]
});

IwantBusinessSchema.index({ customerMobile: 1 });

module.exports = mongoose.model('I Want Business', IwantBusinessSchema);
