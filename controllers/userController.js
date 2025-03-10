// Import necessary models
const IWantCustomer = require('../models/IWantCustomer');
const IWantBusiness = require('../models/IWantBusiness');

const callApi = require('../config/callApi');

const fcmUrl = 'https://entity-fcm-git-dukanbikan-fcm-pratik97669966s-projects.vercel.app/sendNotificationToTopic';

exports.iwant = async (req, res) => {
    const { customerName, customerUid, customerSearchKeywords, customerMobile, requestNote, businessList } = req.body;

    try {
        // Always create a new record
        const view = new IWantCustomer({
            customerMobile,
            customerName,
            customerSearchKeywords,
            customerUid,
            requestNote,
            businessList,
            date: new Date()
        });
        await view.save();

        // Iterate over the businessList and send notifications using map
        const notificationPromises = businessList.map(async (business) => {
            if (business) {
                const businessRecord = await IWantBusiness.findOne({ businessNumber: business.businessNumber });
                if (!businessRecord) {
                    // Create a new business record if it does not exist
                    businessRecord = await new IWantBusiness({
                        businessNumber: business.businessNumber,
                        businessId: business.businessId,
                        businessName: business.businessName,
                        customerContactNumber: business.customerContactNumber,
                        customerList: []
                    });
                }
                if (businessRecord) {
                    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                    const recentCustomerRecord = await IWantBusiness.findOne({
                        businessNumber: business.businessNumber,
                        'customerList.customerMobile': customerMobile,
                        'customerList.date': { $gte: thirtyMinutesAgo }
                    }, {
                        'customerList.$': 1
                    });

                    if (recentCustomerRecord) {
                        // Update the recent customer record
                        const customer = recentCustomerRecord.customerList[0];
                        customer.customerName = customerName;
                        customer.customerSearchKeywords = customerSearchKeywords;
                        customer.customerUid = customerUid;
                        customer.requestNote = requestNote;
                        customer.date = new Date();
                    } else {

                        businessRecord.customerList.push({
                            customerName,
                            customerUid,
                            customerSearchKeywords,
                            customerMobile,
                            requestNote,
                            date: new Date()
                        });
                    }

                    await businessRecord.save();

                    const payload = {
                        topic: "User" + business.businessNumber,
                        title: `new lead from ${customerName}`,
                        messageBody: requestNote,
                        senderName: customerName,
                        senderId: customerMobile,
                        name: customerName,
                    };
                    console.log("payload", payload);
                    await callApi(fcmUrl, payload)
                        .then(response => {
                            console.log('Notification sent:', response);
                        })
                        .catch(error => {
                            console.error('Error sending notification:', error);
                        });
                }
            }
        });

        // Wait for all notifications to be sent
        await Promise.all(notificationPromises);

        res.status(200).json(view);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllIWantCustomers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const totalCustomers = await IWantCustomer.countDocuments();
        const customers = await IWantCustomer.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const response = {
            page: { totalPages: Math.ceil(totalCustomers / limit), currentPage: page },
            customers,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getCustomersByBusinessMobile = async (req, res) => {
    const { businessMobile } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const business = await IWantBusiness.findOne({ businessNumber: businessMobile });
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const totalCustomers = business.customerList.length;
        const customers = await IWantBusiness.aggregate([
            { $match: { businessNumber: businessMobile } },
            { $unwind: "$customerList" },
            { $sort: { "customerList.date": -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $group: {
                    _id: "$_id",
                    customerList: { $push: "$customerList" }
                }
            },
            { $project: { customerList: 1, _id: 0 } }
        ]);

        const response = {
            page: { totalPages: Math.ceil(totalCustomers / limit), currentPage: page },
            customers: customers[0] ? customers[0].customerList : [],
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllBusinessesWithCustomerCount = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const totalBusinesses = await IWantBusiness.countDocuments();
        const businesses = await IWantBusiness.aggregate([
            { $sort: { date: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    businessNumber: 1,
                    businessId: 1,
                    businessName: 1,
                    customerContactNumber: 1,
                    customerCount: { $size: "$customerList" }
                }
            }
        ]);

        const response = {
            page: { totalPages: Math.ceil(totalBusinesses / limit), currentPage: page },
            businesses,
            totalBusinesses
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

