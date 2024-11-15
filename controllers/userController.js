const Sequence = require('../models/Sequence');
const User = require('../models/User');
const ProfileView = require('../models/ProfileView');
const Interest = require('../models/Interest');
const Block = require('../models/Block');

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
// Get Who Viewed My Profile
exports.getMyViewedProfile = async (req, res) => {
    const { userId } = req.params;
    console.log('getMyViewedProfile', userId);
    try {
        const views = await ProfileView.find({ viewerId: userId });
        res.status(200).json(views);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get Who Viewed My Profile
exports.getWhoViewedProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const views = await ProfileView.find({ viewedUserId: userId });
        res.status(200).json(views);
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
        const [profileViewsCount, interestsReceivedCount, interestsSentCount, blockedCount] = await Promise.all([
            ProfileView.countDocuments({ viewerId: userId }), // Count of profiles viewed by this user
            Interest.countDocuments({ targetUserId: userId }), // Count of interests received
            Interest.countDocuments({ interestedUserId: userId }), // Count of interests made
            Block.countDocuments({ blockerId: userId }) // Count of users blocked by this user
        ]);

        res.status(200).json({
            profileViewsCount,
            interestsReceivedCount,
            interestsSentCount,
            blockedCount
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
