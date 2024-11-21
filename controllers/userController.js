const Sequence = require('../models/Sequence');
const User = require('../models/User');
const ProfileView = require('../models/ProfileView');
const Interest = require('../models/Interest');
const Block = require('../models/Block');
const MyContacts = require('../models/MyContacts');

// Record or Update Profile View with Latest Date
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

// Record or Update Interest with Latest Date
exports.showInterest = async (req, res) => {
    const { interestedUserId, targetUserId } = req.body;
    try {
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
// Record or Update My Contacts with Latest Date
exports.myContacts = async (req, res) => {
    const { myUserId, } = req.body;
    try {
        const contacts = await MyContacts.findOneAndUpdate(
            { myUserId, contactUserId },
            { date: new Date() },
            { new: true, upsert: true }
        );
        res.status(200).json({ message: 'My Contscts recorded or updated successfully', contacts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get List of Profiles I have Viewed with Pagination
exports.getMyViewedProfiles = async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    // Ensure `page` and `limit` are positive integers
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const skip = (page - 1) * limit;

    try {
        // Total count of views to calculate total pages
        const totalViews = await ProfileView.countDocuments({ viewerId: userId });

        // Fetch the paginated views sorted by date in descending order
        const views = await ProfileView.find({ viewerId: userId })
            .sort({ date: -1 }) // Sort by date descending
            .skip(skip)
            .limit(limit)
            .exec();

        // Populate user data for the viewed profiles
        const userCountList = await Promise.all(
            views.map(async (view) => {
                const viewedUser = await User.findOne({ userId: view.viewedUserId });
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
        res.status(500).json({ error: error.message });
    }
};

// Get List of Users Who Viewed My Profile with Pagination
exports.getWhoViewedProfile = async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page

    // Ensure `page` and `limit` are positive integers
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const skip = (page - 1) * limit;

    try {
        console.log({ userId, page, limit, skip });

        // Total count of views to calculate total pages
        const totalViews = await ProfileView.countDocuments({ viewedUserId: userId });
        console.log({ totalViews });

        // Fetch the paginated views
        const views = await ProfileView.find({ viewedUserId: userId })
            .sort({ date: -1 }) // Sort by date descending
            .skip(skip)
            .limit(limit)
            .exec();
        console.log({ views });

        // Populate user data for the viewed profiles
        const userCountList = await Promise.all(
            views.map(async (view) => {
                const viewedUser = await User.findOne({ userId: view.viewerId });
                console.log({ view, viewedUser });
                return viewedUser;
            })
        );

        // Filter out any null values in case some user data is missing
        const filteredUserCountList = userCountList.filter((user) => user !== null);
        console.log({ filteredUserCountList });

        // Construct the response
        const response = {
            page: {
                totalPages: Math.ceil(totalViews / limit),
                currentPage: page,
            },
            userCountList: filteredUserCountList,
        };

        console.log("Response:", JSON.stringify(response, null, 2));
        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get List of Profiles I have Viewed with Pagination
exports.getMyContactsProfiles = async (req, res) => {
    const { userId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    // Ensure `page` and `limit` are positive integers
    page = Math.max(parseInt(page, 10), 1);
    limit = Math.max(parseInt(limit, 10), 1);

    const skip = (page - 1) * limit;

    try {
        // Total count of views to calculate total pages
        const totalViews = await MyContacts.countDocuments({ myUserId: userId });

        // Fetch the paginated views sorted by date in descending order
        const views = await ProfileView.find({ myUserId: userId })
            .sort({ date: -1 }) // Sort by date descending
            .skip(skip)
            .limit(limit)
            .exec();

        // Populate user data for the mycontacts profiles
        const userCountList = await Promise.all(
            views.map(async (view) => {
                const viewedUser = await User.findOne({ userId: view.contactUserId });
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
        res.status(500).json({ error: error.message });
    }
};
// Get Interests Shown to Me
exports.getInterestsShownToMe = async (req, res) => {
    const { userId } = req.params;
    try {
        const interests = await Interest.find({ targetUserId: userId });
        res.status(200).json(interests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Counts for Specific Data Points
exports.getCounts = async (req, res) => {
    const { userId } = req.params;

    try {
        // Use Promise.all to perform all queries concurrently
        const [myProfileViewsCount, otherProfileViewsCount, interestsReceivedCount, interestsSentCount, blockedCount, myContacts] = await Promise.all([
            ProfileView.countDocuments({ viewerId: userId }), // Count of profiles viewed by this user
            ProfileView.countDocuments({ viewedUserId: userId }), // Count of profiles viewed by Other user
            Interest.countDocuments({ targetUserId: userId }), // Count of interests received
            Interest.countDocuments({ interestedUserId: userId }), // Count of interests made
            Block.countDocuments({ blockerId: userId }), // Count of users blocked by this user
            MyContacts.countDocuments({ myUserId: userId }) // Count of users my contacts by this user
        ]);

        res.status(200).json({
            myProfileViewsCount,
            otherProfileViewsCount,
            interestsReceivedCount,
            interestsSentCount,
            blockedCount,
            myContacts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Block a User
exports.blockUser = async (req, res) => {
    const { userId, blockedUserId } = req.body;
    if (!userId || !blockedUserId) {
        return res.status(400).json({ message: 'Both userId and blockedUserId are required' });
    }
    try {
        const existingBlock = await Block.findOne({ blockerId: userId, blockedUserId });
        if (existingBlock) {
            return res.status(400).json({ message: 'User is already blocked' });
        }

        const block = new Block({ blockerId: userId, blockedUserId });
        await block.save();

        res.status(200).json({ message: 'User blocked successfully', block });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get List of Blocked Users
exports.getBlockedUsers = async (req, res) => {
    const { userId } = req.params;
    try {
        const blockedByMe = await Block.find({ blockerId: userId });
        res.status(200).json(blockedByMe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to generate a unique user ID
const generateUserId = async (prefix) => {
    let sequence = await Sequence.findOne({ prefix });

    if (!sequence) {
        sequence = new Sequence({ prefix, sequence: 0 });
    }

    sequence.sequence += 1;
    await sequence.save();

    return `${prefix}${String(sequence.sequence).padStart(5, '0')}`; // e.g., lastUser00001
};

// Create a new user
exports.createNewUser = async (req, res) => {
    try {
        const { prefix, ...userData } = req.body;

        if (!prefix) {
            return res.status(400).json({ message: 'Prefix is required' });
        }

        const userId = await generateUserId(prefix);

        const user = new User({ ...userData, userId });
        await user.save();

        res.status(201).json(user);
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
            {
                $match: { gender, membershipPlan: "Paid" }
            },
            {
                $sample: { size: 50 }
            },
        ]);
        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
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
