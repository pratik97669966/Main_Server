// Import necessary models
const Sequence = require('../models/Sequence');
const User = require('../models/User');
const ProfileView = require('../models/ProfileView');
const Interest = require('../models/Interest');
const Block = require('../models/Block');
const MyContacts = require('../models/MyContacts');
const ShortListed = require('../models/ShortListed');
const ViewContact = require('../models/ViewContact');
// Utility Functions
// Generate a unique user ID
const generateUserId = async (prefix) => {
    let sequence = await Sequence.findOne({ prefix });

    if (!sequence) {
        sequence = new Sequence({ prefix, sequence: 0 });
    }

    sequence.sequence += 1;
    await sequence.save();

    return `${prefix}${String(sequence.sequence).padStart(4, '0')}`; // e.g., lastUser00001
};

// User Management
// Create a new user
exports.createNewUser = async (req, res) => {
    try {
        const { prefix, ...userData } = req.body;

        if (!prefix) {
            return res.status(400).json({ message: 'Prefix is required' });
        }

        const userId = await generateUserId(prefix);

        const user = new User({ ...userData, userId, activationDate: Date.now() });
        await user.save();

        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
// Set Last Seen for a User
exports.setLastSeen = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    try {
        const currentTimeMillis = Date.now(); // Current time in milliseconds

        const user = await User.findOneAndUpdate(
            { userId },
            { $set: { lastSeen: currentTimeMillis } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Last seen updated successfully', lastSeen: currentTimeMillis });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update an existing user
exports.updateUser = async (req, res) => {
    const userData = req.body;
    const { userId } = userData;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required for update' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { userId },
            { $set: userData },
            { new: true, upsert: false }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a user by userId
exports.getUserById = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get users by gender
exports.getUsersByGender = async (req, res) => {
    const { gender } = req.params;

    try {
        const users = await User.aggregate([
            { $match: { gender, membershipPlan: "Paid" } },
            { $sample: { size: 50 } },
        ]);
        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
// Get users by gender
exports.getUsersByFilter = async (req, res) => {
    const { userId, gender, lookingfor } = req.params;

    try {
        // Step 1: Find the user by userId
        const user = await User.findOne({ userId });

        // If user is not found, return an error response
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Step 2: Build the match filter dynamically based on the user's preferences
        const matchFilter = {
            gender: user.gender === "Male" ? "Female" : "Male", // Adjust based on your logic
            membershipPlan: "Paid",
            status: "ACTIVE_USER",
        };

        // If the user has a specific preference for marital status, apply it
        if (user.lookingFor && user.lookingFor !== "All") {
            matchFilter.maritalStatus = user.lookingFor;
        }

        // Step 3: Query the database for matching users
        const users = await User.aggregate([
            { $match: matchFilter }, // Apply filters
            { $sample: { size: 50 } }, // Random sampling
        ]);

        // Step 4: Send the matching users in the response
        res.json(users);
    } catch (error) {
        // Catch and handle errors
        res.status(500).json({ error: error.message });
    }
};
// unregister user
exports.getUnregister = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const matchFilter = {
            status: "NEW_ACCOUNT",
        };

        const totalUnregister = await User.countDocuments(matchFilter); // Total number of new accounts
        const unregisterUsers = await User.find(matchFilter)
            .sort({ activationDate: -1 }) // Sort by activationDate in descending order
            .skip(skip)
            .limit(Number(limit));

        const response = {
            page: {
                totalPages: Math.ceil(totalUnregister / limit),
                currentPage: Number(page),
                totalRecords: totalUnregister,
            },
            users: unregisterUsers,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// API function for search by name
const userIdPattern = /^[A-Z]{2}\d{4}$/;

exports.searchByName = async (req, res) => {
    const searchData = req.body;
    const { name, gender } = searchData;

    try {
        // Validate if name is passed in the query
        if (!name) {
            return res.status(400).json({ error: "Name parameter is required" });
        }

        // Create the filter object dynamically
        let filter = {};

        // Check if the name matches the userId pattern (e.g., KB4521, KG4589)
        if (userIdPattern.test(name)) {
            // If it matches the pattern, search by userId
            filter.userId = name;
        } else {
            // If it's a name, search by name (case-insensitive)
            filter.name = { $regex: name, $options: "i" };
        }

        // If gender is provided, include it in the filter
        if (gender) {
            filter.gender = gender;
        }

        // Perform the query using find and limit the results to 50 records
        const users = await User.find(filter).limit(50);  // Limit the results to 50 users for performance

        // Return the whole user object for each result
        res.json(users);

    } catch (error) {
        // Handle errors (e.g., database connection, query issues)
        res.status(500).json({ error: error.message });
    }
};



// Delete a user by userId
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findOneAndDelete({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Profile Views Management
// Record or update a profile view
exports.viewProfile = async (req, res) => {
    const { viewerId, viewedUserId } = req.body;
    try {
        const view = await ProfileView.findOneAndUpdate(
            { viewerId, viewedUserId },
            { date: new Date() },
            { new: true, upsert: true }
        );
        res.status(200).json({ view });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get list of profiles I have viewed
exports.getMyViewedProfiles = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const totalViews = await ProfileView.countDocuments({ viewerId: userId });
        const views = await ProfileView.find({ viewerId: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const userCountList = await Promise.all(
            views.map(async (view) => User.findOne({ userId: view.viewedUserId }))
        );

        const response = {
            page: { totalPages: Math.ceil(totalViews / limit), currentPage: page },
            userCountList: userCountList.filter(Boolean),
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get list of users who viewed my profile
exports.getWhoViewedProfile = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const totalViews = await ProfileView.countDocuments({ viewedUserId: userId });
        const views = await ProfileView.find({ viewedUserId: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const userCountList = await Promise.all(
            views.map(async (view) => User.findOne({ userId: view.viewerId }))
        );

        const response = {
            page: { totalPages: Math.ceil(totalViews / limit), currentPage: page },
            userCountList: userCountList.filter(Boolean),
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Interests Management
exports.showInterest = async (req, res) => {
    const { interestedUserId, targetUserId, status } = req.body;

    try {
        if (['CANCELLED', 'REJECTED'].includes(status)) {
            await Interest.deleteOne({ interestedUserId, targetUserId });
            return res.status(200).json({ message: 'Interest removed successfully' });
        }

        if (status === 'ACCEPTED') {
            await Interest.deleteOne({ interestedUserId, targetUserId });
            const date = new Date();
            await Promise.all([
                MyContacts.findOneAndUpdate(
                    { myUserId: interestedUserId, contactUserId: targetUserId },
                    { date },
                    { new: true, upsert: true }
                ),
                MyContacts.findOneAndUpdate(
                    { myUserId: targetUserId, contactUserId: interestedUserId },
                    { date },
                    { new: true, upsert: true }
                ),
            ]);
            return res.status(200).json({ message: 'Interest accepted and contacts updated successfully' });
        }

        const interest = await Interest.findOneAndUpdate(
            { interestedUserId, targetUserId },
            { date: new Date() },
            { new: true, upsert: true }
        );
        res.status(200).json({ message: 'Interest recorded or updated successfully', interest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get Interests getInterestsSend
exports.getInterestsSend = async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page

    // Ensure `page` and `limit` are positive integers
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const skip = (page - 1) * limit;

    try {

        // Total count of views to calculate total pages
        const totalViews = await Interest.countDocuments({ interestedUserId: userId });

        // Fetch the paginated views
        const views = await Interest.find({ interestedUserId: userId })
            .sort({ date: -1 }) // Sort by date descending
            .skip(skip)
            .limit(limit)
            .exec();

        // Populate user data for the viewed profiles
        const userCountList = await Promise.all(
            views.map(async (view) => {
                const viewedUser = await User.findOne({ userId: view.targetUserId });
                return viewedUser;
            })
        );

        // Filter out any null values in case some user data is missing
        const filteredUserCountList = userCountList.filter((user) => user !== null);

        // Construct the response
        const response = {
            page: {
                totalPages: Math.ceil(totalViews / limit),
                currentPage: page,
            },
            userCountList: filteredUserCountList,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};
// Get Interests getInterestsRecived
exports.getInterestsRecived = async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page

    // Ensure `page` and `limit` are positive integers
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const skip = (page - 1) * limit;

    try {

        // Total count of views to calculate total pages
        const totalViews = await Interest.countDocuments({ targetUserId: userId });

        // Fetch the paginated views
        const views = await Interest.find({ targetUserId: userId })
            .sort({ date: -1 }) // Sort by date descending
            .skip(skip)
            .limit(limit)
            .exec();

        // Populate user data for the viewed profiles
        const userCountList = await Promise.all(
            views.map(async (view) => {
                const viewedUser = await User.findOne({ userId: view.interestedUserId });
                return viewedUser;
            })
        );

        // Filter out any null values in case some user data is missing
        const filteredUserCountList = userCountList.filter((user) => user !== null);

        // Construct the response
        const response = {
            page: {
                totalPages: Math.ceil(totalViews / limit),
                currentPage: page,
            },
            userCountList: filteredUserCountList,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};
// Contacts Management
// Add a contact
exports.addContact = async (req, res) => {
    const { myUserId, contactUserId } = req.body;

    try {
        const date = new Date();

        // Add contact in both directions
        await Promise.all([
            MyContacts.findOneAndUpdate(
                { myUserId, contactUserId },
                { date },
                { new: true, upsert: true }
            ),
            MyContacts.findOneAndUpdate(
                { myUserId: contactUserId, contactUserId: myUserId },
                { date },
                { new: true, upsert: true }
            ),
        ]);

        res.status(200).json({ message: 'Contact added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get contacts of a user
exports.getContacts = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const totalContacts = await MyContacts.countDocuments({ myUserId: userId });
        const contacts = await MyContacts.find({ myUserId: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const contactDetails = await Promise.all(
            contacts.map(async (contact) => User.findOne({ userId: contact.contactUserId }))
        );

        // Filter out any null values in case some user data is missing
        const filteredUserCountList = contactDetails.filter((user) => user !== null);

        // Construct the response
        const response = {
            page: {
                totalPages: Math.ceil(totalContacts / limit),
                currentPage: page,
            },
            userCountList: filteredUserCountList,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove a contact
exports.removeContact = async (req, res) => {
    const { myUserId, contactUserId } = req.body;

    try {
        await Promise.all([
            MyContacts.deleteOne({ myUserId, contactUserId }),
            MyContacts.deleteOne({ myUserId: contactUserId, contactUserId: myUserId }),
        ]);

        res.status(200).json({ message: 'Contact removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// ShortList Management
// Add to ShortList
exports.addShortlisted = async (req, res) => {
    const { myUserId, shortListUserId, status } = req.body;
    if (['REMOVE'].includes(status)) {
        await ShortListed.deleteOne({ myUserId, shortListUserId });
        return res.status(200).json({ message: 'Shortlist removed successfully' });
    }
    try {
        const view = await ShortListed.findOneAndUpdate(
            { myUserId, shortListUserId },
            { date: new Date() },
            { new: true, upsert: true }
        );
        res.status(200).json({ view });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.viewContact = async (req, res) => {
    const { viewContactUserId, viewContactTargetUserId, viewContactStatus } = req.body;
    // if (['REMOVE'].includes(viewContactStatus)) {
    //     await ShortListed.deleteOne({ viewContactUserId, viewContactTargetUserId });
    //     return res.status(200).json({ message: 'View Contact removed successfully' });
    // }
    try {
        const view = await ViewContact.findOneAndUpdate(
            { viewContactUserId, viewContactTargetUserId, viewContactStatus },
            { date: new Date() },
            { new: true, upsert: true }
        );
        res.status(200).json({ view });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// getViewContactSend
exports.getViewContactSend = async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page

    // Ensure `page` and `limit` are positive integers
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const skip = (page - 1) * limit;

    try {
        // Total count of views to calculate total pages
        const totalViews = await ViewContact.countDocuments({ viewContactUserId: userId });

        // Fetch the paginated views
        const views = await ViewContact.find({ viewContactUserId: userId })
            .sort({ date: -1 }) // Sort by date descending
            .skip(skip)
            .limit(limit)
            .exec();

        // Populate user data for the viewed profiles
        const userCountList = await Promise.all(
            views.map(async (view, index) => {
                const viewedUser = await User.findOne({ userId: view.viewContactTargetUserId });
                const response = {
                    userData: viewedUser,
                    viewContact: views[index],
                };
                return response;
            })
        );

        // Filter out any null values in case some user data is missing
        // const filteredUserCountList = userCountList.filter((user) => user !== null);

        // Construct the response
        const response = {
            page: {
                totalPages: Math.ceil(totalViews / limit),
                currentPage: page,
            },
            userCountList: userCountList,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};
// getViewContactReceived
exports.getViewContactReceived = async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page

    // Ensure `page` and `limit` are positive integers
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const skip = (page - 1) * limit;

    try {

        // Total count of views to calculate total pages
        const totalViews = await ViewContact.countDocuments({ viewContactTargetUserId: userId });

        // Fetch the paginated views
        const views = await ViewContact.find({ viewContactTargetUserId: userId })
            .sort({ date: -1 }) // Sort by date descending
            .skip(skip)
            .limit(limit)
            .exec();

        // Populate user data for the viewed profiles
        const userCountList = await Promise.all(
            views.map(async (view, index) => {
                const viewedUser = await User.findOne({ userId: view.viewContactUserId });
                const response = {
                    userData: viewedUser,
                    viewContact: views[index],
                };
                return response;
            })
        );

        // Filter out any null values in case some user data is missing
        // const filteredUserCountList = userCountList.filter((user) => user !== null);

        // Construct the response
        const response = {
            page: {
                totalPages: Math.ceil(totalViews / limit),
                currentPage: page,
            },
            userCountList: userCountList,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};
// Get contacts of a user
exports.getShortlisted = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const totalContacts = await ShortListed.countDocuments({ myUserId: userId });
        const contacts = await ShortListed.find({ myUserId: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const contactDetails = await Promise.all(
            contacts.map(async (contact) => User.findOne({ userId: contact.shortListUserId }))
        );

        // Filter out any null values in case some user data is missing
        const filteredUserCountList = contactDetails.filter((user) => user !== null);

        // Construct the response
        const response = {
            page: {
                totalPages: Math.ceil(totalContacts / limit),
                currentPage: page,
            },
            userCountList: filteredUserCountList,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Block Management
// Block a user
exports.blockUser = async (req, res) => {
    const { blockerId, blockedId } = req.body;

    try {
        const block = await Block.findOneAndUpdate(
            { blockerId, blockedId },
            { date: new Date() },
            { new: true, upsert: true }
        );

        res.status(200).json({ message: 'User blocked successfully', block });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const totalBlocks = await Block.countDocuments({ blockerId: userId });
        const blocks = await Block.find({ blockerId: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const blockedUsers = await Promise.all(
            blocks.map(async (block) => User.findOne({ userId: block.blockedId }))
        );

        const response = {
            page: { totalPages: Math.ceil(totalBlocks / limit), currentPage: page },
            blockedUsers: blockedUsers.filter(Boolean),
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
    const { blockerId, blockedId } = req.body;

    try {
        await Block.deleteOne({ blockerId, blockedId });
        res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Statistics and Counts
// Fetch data counts for the user
exports.getCounts = async (req, res) => {
    const { userId } = req.params;

    try {
        // Use Promise.all to perform all queries concurrently
        const [myProfileViewsCount, otherProfileViewsCount, interestsReceivedCount, interestsSentCount, blockedCount, myContacts, shortListed, contactRequestSendCount, contactRequestReceivedCount] = await Promise.all([
            ProfileView.countDocuments({ viewerId: userId }),
            ProfileView.countDocuments({ viewedUserId: userId }),
            Interest.countDocuments({ targetUserId: userId }),
            Interest.countDocuments({ interestedUserId: userId }),
            Block.countDocuments({ blockerId: userId }),
            MyContacts.countDocuments({ myUserId: userId }),
            ShortListed.countDocuments({ myUserId: userId }),
            ViewContact.countDocuments({ viewContactUserId: userId }),
            ViewContact.countDocuments({ viewContactTargetUserId: userId }),
        ]);

        res.status(200).json({
            myProfileViewsCount,
            otherProfileViewsCount,
            interestsReceivedCount,
            interestsSentCount,
            blockedCount,
            myContacts,
            shortListed,
            contactRequestSendCount,
            contactRequestReceivedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


