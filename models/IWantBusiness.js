const mongoose = require('mongoose');

const IWantBusinessSchema = new mongoose.Schema({
    businessNumber: { type: String, required: true },
    businessId: { type: String, required: true },
    businessName: { type: String, required: true },
    customerContactNumber: { type: String, required: true },
    customerList: [{
        customerName: { type: String, required: true },
        customerUid: { type: String, required: true },
        customerSearchKeywords: { type: String, required: true },
        customerMobile: { type: String, required: true },
        date: { type: Date, default: Date.now },
        requestNote: { type: String, required: true },
    }]
});

IWantBusinessSchema.index({ customerMobile: 1 });

module.exports = mongoose.model('IWantBusiness', IWantBusinessSchema);