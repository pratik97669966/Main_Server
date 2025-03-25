// Import necessary models
const IWantCustomer = require('../models/IWantCustomer');
const IWantBusiness = require('../models/IWantBusiness');
const BusinessSubscriber = require('../models/BusinessSubscriber');

const callApi = require('../config/callApi');

const fcmUrl = 'https://entity-fcm-git-dukanbikan-fcm-pratik97669966s-projects.vercel.app/sendNotificationToTopic';

exports.businessSubscriber = async (req, res) => {
    const { businessNumber, businessId, businessName, customerContactNumber, customerList } = req.body;

    try {
        // Check if the business exists
        let existingBusiness = await BusinessSubscriber.findOne({ businessNumber });

        if (!existingBusiness) {
            // Create a new business record if it does not exist
            const newBusiness = new BusinessSubscriber({
                businessNumber,
                businessId,
                businessName,
                customerContactNumber,
                customerList
            });

            await newBusiness.save();

            const payload = {
                topic: "User" + businessNumber,
                title: `New Subscribers for ${businessName}`,
                messageBody: `${customerList.length} new subscribers have joined.`,
                notification_type: "LEADS",
                navigate_to: "SUBSCRIBERS_LIST"
            };

            await callApi(fcmUrl, payload)
                .then(response => console.log('Notification sent:', response))
                .catch(error => console.error('Error sending notification:', error));

            return res.status(201).json({ message: 'Business created successfully.', business: newBusiness });
        }

        // Ensure unique customers (update existing ones, add new ones)
        const updatedCustomerList = [...existingBusiness.customerList];

        customerList.forEach(newCustomer => {
            const existingIndex = updatedCustomerList.findIndex(
                customer => customer.customerMobile === newCustomer.customerMobile
            );

            if (existingIndex !== -1) {
                // Update existing customer details
                updatedCustomerList[existingIndex] = { ...updatedCustomerList[existingIndex], ...newCustomer };
            } else {
                // Add new customer
                updatedCustomerList.push(newCustomer);
            }
        });

        // Update business with unique customers
        const updateResult = await BusinessSubscriber.findOneAndUpdate(
            { businessNumber },
            {
                $set: { businessId, businessName, customerContactNumber, customerList: updatedCustomerList }
            },
            { new: true }
        );

        // Identify truly new subscribers for notification
        const newSubscribers = customerList.filter(newCustomer =>
            !existingBusiness.customerList.some(existingCustomer => existingCustomer.customerMobile === newCustomer.customerMobile)
        );

        if (newSubscribers.length > 0) {
            const payload = {
                topic: "User" + businessNumber,
                title: `New Subscribers for ${businessName}`,
                messageBody: `${newSubscribers.length} new subscribers have joined.`,
                notification_type: "LEADS",
                navigate_to: "SUBSCRIBERS_LIST"
            };

            await callApi(fcmUrl, payload)
                .then(response => console.log('Notification sent:', response))
                .catch(error => console.error('Error sending notification:', error));
        }

        res.status(200).json({ message: 'Subscribers updated successfully.', business: updateResult });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSubscribersByBusinessMobile = async (req, res) => {
    const { businessMobile } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const business = await BusinessSubscriber.findOne({ businessNumber: businessMobile });

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const totalSubscribers = business.customerList.length;
        const subscribers = business.customerList.slice(skip, skip + parseInt(limit));

        const response = {
            page: { totalPages: Math.ceil(totalSubscribers / parseInt(limit)), currentPage: parseInt(page) },
            subscribers,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSubscriberCount = async (req, res) => {
    const { businessMobile } = req.params;

    try {
        const business = await BusinessSubscriber.findOne({ businessNumber: businessMobile });

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const subscriberCount = business.customerList.length;

        res.status(200).json({ businessMobile, subscriberCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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

                if (businessRecord) {
                    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                    const recentCustomerRecord = await IWantBusiness.findOne({
                        businessNumber: business.businessNumber,
                        'customerList.customerMobile': customerMobile,
                        // 'customerList.date': { $gte: thirtyMinutesAgo },
                        'customerList.requestNote': requestNote
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
                        image_url: "/thmb/yhgiLuSTcFaN1WbwUua_W9SMHws=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/prettiest-flowers-painted-tongue-flower-lead-getty-1123-00763085ad384a9b9bf1f5cc81bee390.jpg",
                        senderName: customerName,
                        senderId: customerMobile,
                        name: customerName,
                        payload: {},
                        notification_type: "LEADS",
                        navigate_to: "LEADS"
                    };
                    await callApi(fcmUrl, payload)
                        .then(response => {
                            console.log('Notification sent:', response);
                        })
                        .catch(error => {
                            console.error('Error sending notification:', error);
                        });
                } else {
                    // Create a new business record if it does not exist
                    const businessRecordNew = new IWantBusiness({
                        businessNumber: business.businessNumber,
                        businessId: business.businessId,
                        businessName: business.businessName,
                        customerContactNumber: business.customerContactNumber,
                        customerList: []
                    });

                    businessRecordNew.customerList.push({
                        customerName,
                        customerUid,
                        customerSearchKeywords,
                        customerMobile,
                        requestNote,
                        date: new Date()
                    });
                    await businessRecordNew.save();

                    const payload = {
                        topic: "User" + business.businessNumber,
                        title: `new lead from ${customerName}`,
                        messageBody: requestNote,
                        image_url: "https://www.marthastewart.com/thmb/yhgiLuSTcFaN1WbwUua_W9SMHws=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/prettiest-flowers-painted-tongue-flower-lead-getty-1123-00763085ad384a9b9bf1f5cc81bee390.jpg",
                        senderName: customerName,
                        senderId: customerMobile,
                        name: customerName,
                        payload: {},
                        notification_type: "LEADS",
                        navigate_to: "LEADS"
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
// iwant update by id
exports.updateIWantCustomerById = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // const updatedCustomer = await IWantCustomer.findByIdAndUpdate(
        //     id,
        //     { status },
        //     { new: true }
        // );

        // if (!updatedCustomer) {
        //     return res.status(404).json({ error: 'Customer not found' });
        // }

        // Update the status in the business record as well
        const businessRecord = await IWantBusiness.findOne({ 'customerList._id': id });
        if (businessRecord) {
            const customer = businessRecord.customerList.id(id);
            customer.status = status;
            await businessRecord.save();
        }

        res.status(200).json(req.body);
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
            { $limit: parseInt(limit) },
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
