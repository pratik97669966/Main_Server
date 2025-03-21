const mongoose = require('mongoose');

const BusinessSubscriberSchema = new mongoose.Schema({
    businessNumber: String,
    businessId: String,
    businessName: String,
    customerContactNumber: String,
    customerList: [
        {
            customerName: String,
            customerUid: String,
            customerSearchKeywords: String,
            customerMobile: String,
            requestNote: String,
            date: { type: Date, default: Date.now }
        }
    ]
});

const BusinessSubscriber = mongoose.model('BusinessSubscriber', BusinessSubscriberSchema);

module.exports = BusinessSubscriber;
