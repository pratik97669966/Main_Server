const Sequence = require('../models/Sequence.js');
const User = require('../models/User');

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
            { new: true, upsert: false } // upsert: false to avoid creating new document
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

// Get users by gender with specific membership plan and random sampling
exports.getUsersByGender = async (req, res) => {
    const { gender } = req.params;

    try {
        const users = await User.aggregate([
            {
                $match: {
                    gender,
                    membershipPlan: "Paid",
                },
            },
            {
                $sample: {
                    size: 50,
                },
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
