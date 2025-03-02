const mongoose = require('mongoose');

const IwantCustomerSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerUid:{ type: String, required: true },
    customerSearchKeywords:{ type: String, required: true },
    customerMobile: { type: String, required: true },
    date: { type: Date, default: Date.now },
    requestNote: { type: String, required: true },
    businessList:[{
        businessNumber:{ type: String, required: true },
        businessName:{ type: String, required: true },
    }]
});

IwantCustomerSchema.index({ businessNumber: 1 });

module.exports = mongoose.model('I Want Customer', IwantCustomerSchema);
