// Import necessary models
const Sequence = require('../models/Sequence');
const User = require('../models/User');
const ProfileView = require('../models/ProfileView');
const Interest = require('../models/Interest');
const Block = require('../models/Block');
const MyContacts = require('../models/MyContacts');
const ShortListed = require('../models/ShortListed');
const ViewContact = require('../models/ViewContact');
const DeletePhotoUrls = require('../models/DeletePhotoUrls');
const mongoose = require('mongoose');
const moment = require('moment');
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: 'AKIA5WLTSZQIW4RH465S',
    secretAccessKey: '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',
    region: 'ap-south-1',
});

const s3 = new AWS.S3();

// Utility Functions
// Generate a unique user ID
const generateUserId = async (userData) => {
    let prefix = '';

    if (userData.gender === 'Female') {
        if (userData.maritalStatus === 'Unmarried') {
            prefix = 'KG';
        } else if (['Divorced', 'Widowed', 'Widower'].includes(userData.maritalStatus)) {
            prefix = 'KOG';
        }
    } else if (userData.gender === 'Male') {
        if (userData.maritalStatus === 'Unmarried') {
            prefix = 'KB';
        } else if (['Divorced', 'Widowed', 'Widower'].includes(userData.maritalStatus)) {
            prefix = 'KOB';
        }
    }

    let sequence = await Sequence.findOne({ prefix: 'user' });

    if (!sequence) {
        sequence = new Sequence({ prefix: 'user', sequence: 0 });
    }

    sequence.sequence += 1;
    await sequence.save();

    return `${prefix}${String(sequence.sequence).padStart(4, '0')}`;
};

// User Management
// Create a new user
exports.createNewUser = async (req, res) => {
    try {
        const { prefix, ...userData } = req.body;

        if (!prefix) {
            return res.status(400).json({ message: 'Prefix is required' });
        }

        const userId = await generateUserId(userData);

        // Ensure activationDate is explicitly in milliseconds
        const activationDate = Date.now(); // Current time in milliseconds
        const dateOfBirth = userData.dateOfBirth || "";
        const dateOfBirthValue = dateOfBirth ? new Date(dateOfBirth).getTime() : null;
        const user = new User({ ...userData, userId, activationDate, dateOfBirthValue });
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

exports.updateUser = async (req, res) => {
    const userData = req.body;
    const { userId, dateOfBirth } = userData;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required for update' });
    }

    try {
        // Update the user
        const dateOfBirth = userData.dateOfBirth || "";
        if (dateOfBirth) {
            const dateOfBirthValue = new Date(dateOfBirth).getTime();
            userData.dateOfBirthValue = dateOfBirthValue;
        }
        const user = await User.findOneAndUpdate(
            { userId }, // No need to convert _id, Mongoose handles it
            { $set: userData },
            { new: true, upsert: false } // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUserById = async (req, res) => {
    const userData = req.body;
    const { _id, dateOfBirth } = userData;

    if (!_id) {
        return res.status(400).json({ message: 'userId is required for update' });
    }

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ message: 'Invalid userId' });
    }

    try {
        // Update the user
        if (dateOfBirth) {
            const dateOfBirthValue = new Date(dateOfBirth).getTime();
            userData.dateOfBirthValue = dateOfBirthValue;
        }
        const user = await User.findOneAndUpdate(
            { _id }, // No need to convert _id, Mongoose handles it
            { $set: userData },
            { new: true, upsert: false } // Return the updated document
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
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
            { $match: { gender, membershipPlan: { $in: ["Paid", "Active"] } } },
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
            membershipPlan: { $in: ["Paid", "Active"] },
            expiryDate: { $gte: Date.now() }, // Check if the membership is still active
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
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10
    const skip = (page - 1) * limit;

    try {
        const matchFilter = {
            expiryDate: { $lt: Date.now() }
        };

        // Count total number of new accounts
        const totalUnregister = await User.countDocuments(matchFilter);

        // Fetch the users with pagination in reverse order (e.g., newest first)
        const unregisterUsers = await User.find(matchFilter)
            .sort({ _id: -1 }) // Sort in descending order of _id
            .skip(skip)
            .limit(limit)
            .exec();

        const response = {
            page: {
                totalPages: Math.ceil(totalUnregister / limit), // Total pages calculation
                currentPage: page,
                totalRecords: totalUnregister,
            },
            userCountList: unregisterUsers,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching unregistered users:", error.message);
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
};


// API function for search by name
exports.searchByName = async (req, res) => {
    const searchData = req.body;
    const {
        isAdmin = false,
        isAdvancedSearch = false,
        name,
        gender,
        lookingFor,
        partnerAgeRange,
        partnerHeightRange,
        partnerIncomeRange,
        partnerComplexion,
        partnerDiet,
        expectedEducation,
        partnerOccupation,
        partnerReligion,
        partnerCaste,
        partnerSubCaste,
        readyToMarryInSameCaste,
        partnerCountryLivingIn,
        partnerState,
        preferredWorkingCities,
        preferredNativeCities,
        partnerExpectations
    } = searchData;
    const userIdPattern = /^(KG|KOG|KB|KOB|KO)\d{4}$/;
    const mobileNumberPattern = /^\d{10}$/;

    try {
        let filter = {};
        if (!isAdmin) {
            filter.expiryDate = { $gte: Date.now() };
            filter.membershipPlan = { $in: ["Paid", "Active"] };
            filter.status = "ACTIVE_USER";
            if (gender) {
                filter.gender = gender;
            }
        }
        if (isAdvancedSearch) {

            // Marital Status
            if (lookingFor && lookingFor != 'All') filter.maritalStatus = lookingFor;
            if (partnerAgeRange) {
                const ages = partnerAgeRange.split("To").map(it => it.replace("From", "").trim());
                if (ages.length === 2) {
                    // Convert to milliseconds
                    const fromDateMillis = moment().subtract(ages[1], 'years').startOf('year').valueOf();  // Convert to milliseconds
                    const toDateMillis = moment().subtract(ages[0], 'years').endOf('year').valueOf();      // Convert to milliseconds
                    filter.dateOfBirthValue = { $gte: fromDateMillis, $lte: toDateMillis };
                }
            }
            // Partner Height
            if (partnerHeightRange) {
                const heights = partnerHeightRange
                    .split("To")
                    .map(it => it.replace("From", "").replace("\u0027", "'").trim());
                if (heights.length === 2) {
                    filter.height = { $gte: heights[0], $lte: heights[1] };
                }
            }

            // Education
            // if (expectedEducation && expectedEducation !== "Any") {
            //     const educationArray = expectedEducation.split(",").map(it => it.trim());
            //     if (educationArray.length > 0) {
            //         filter.education = {
            //             $in: educationArray.map(value => new RegExp(`^${value}$`, 'i'))
            //         };
            //     }
            // }

            // // Occupation
            // if (partnerOccupation && partnerOccupation !== "Any") {
            //     const occupationArray = partnerOccupation.split(",").map(it => it.trim());
            //     if (occupationArray.length > 0) {
            //         filter.occupation = {
            //             $in: occupationArray.map(value => new RegExp(`^${value}$`, 'i'))
            //         };
            //     }
            // }

            // // Caste
            // if (partnerCaste) {
            //     const casteArray = partnerCaste.split(",").map(it => it.trim());
            //     if (casteArray.length > 0) {
            //         filter.caste = {
            //             $in: casteArray.map(value => new RegExp(`^${value}$`, 'i'))
            //         };
            //     }
            // }

            // // Sub-caste
            // if (partnerSubCaste) {
            //     const subCasteArray = partnerSubCaste.split(",").map(it => it.trim());
            //     if (subCasteArray.length > 0) {
            //         filter.subCaste = {
            //             $in: subCasteArray.map(value => new RegExp(`^${value}$`, 'i'))
            //         };
            //     }
            // }

            // // Ready to marry in the same caste
            // if (readyToMarryInSameCaste) {
            //     const sameCasteArray = readyToMarryInSameCaste.split(",").map(it => it.trim());
            //     if (sameCasteArray.length > 0) {
            //         filter.readyToMarryInSameCaste = {
            //             $in: sameCasteArray.map(value => new RegExp(`^${value}$`, 'i'))
            //         };
            //     }
            // }

            // // Country and State
            // if (partnerCountryLivingIn) filter.country = partnerCountryLivingIn;
            // if (partnerState) filter.state = partnerState;

        }
        else {
            if (!name) {
                return res.status(400).json({ error: "Name parameter is required" });
            }
            if (userIdPattern.test(name.toUpperCase())) {
                filter.userId = name.toUpperCase();
            } else if (mobileNumberPattern.test(name)) {
                filter.phone = name;
            } else {
                filter.name = { $regex: name, $options: "i" };
            }
        }
        const users = await User.find(filter).exec();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error searching users by name:", error.message);
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
};

function convertHeightToInches(height) {
    const [feet, inches] = height.split("'").map(part => part.trim());
    return parseInt(feet) * 12 + parseInt(inches);
}

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
    if (viewerId === viewedUserId) {
        return res.status(400).json({ error: "You cannot view your own profile" });
    }
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
            views.map(async (view) => {
                const user = await User.findOne({ userId: view.viewedUserId });
                if (user) {
                    // Add the viewedDate field to the user object
                    return {
                        ...user.toObject(),
                        viewedDate: view.date
                    };
                }
                return null;
            })
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
            views.map(async (view) => {
                const user = await User.findOne({ userId: view.viewerId });
                if (user) {
                    // Add the viewedDate field to the user object
                    return {
                        ...user.toObject(),
                        viewedDate: view.date
                    };
                }
                return null;
            })
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
    //pratik todo
    try {
        // if (['CANCELLED', 'REJECTED'].includes(status)) {
        //     await Interest.deleteOne({ interestedUserId, targetUserId });
        //     return res.status(200).json({ message: 'Interest removed successfully' });
        // }

        if (status === 'ACCEPTED') {
            await Interest.deleteOne({ interestedUserId, targetUserId, status });
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
                const user = await User.findOne({ userId: view.targetUserId });
                if (user) {
                    // Add the viewedDate field to the user object
                    return {
                        ...user.toObject(),
                        viewedDate: view.date
                    };
                }
                return null;
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
                const user = await User.findOne({ userId: view.interestedUserId });
                if (user) {
                    // Add the viewedDate field to the user object
                    return {
                        ...user.toObject(),
                        viewedDate: view.date
                    };
                }
                return null;
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
    if (myUserId === contactUserId) {
        return res.status(400).json({ error: "You cannot add yourself as a contact" });
    }
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
            contacts.map(async (view) => {
                const user = await User.findOne({ userId: view.contactUserId });
                if (user) {
                    // Add the viewedDate field to the user object
                    return {
                        ...user.toObject(),
                        viewedDate: view.date
                    };
                }
                return null;
            })
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
    if (viewContactUserId === viewContactTargetUserId) {
        return res.status(400).json({ error: "You cannot view your own profile" });
    }
    try {
        const view = await ViewContact.findOneAndUpdate(
            { viewContactUserId, viewContactTargetUserId },
            { viewContactStatus, date: new Date() },
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
                    viewedDate: view.date
                };
                return response;
            })
        );
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
                    viewedDate: view.date
                };
                return response;
            })
        );
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
        const views = await ShortListed.find({ myUserId: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        const contactDetails = await Promise.all(
            views.map(async (view) => {
                const user = await User.findOne({ userId: view.shortListUserId });
                if (user) {
                    // Add the viewedDate field to the user object
                    return {
                        ...user.toObject(),
                        viewedDate: view.date
                    };
                }
                return null;
            })
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

exports.deletePhotoUrl = async (req, res) => {
    const { url, userId } = req.body;

    if (!url || !userId) {
        return res.status(400).json({ error: 'URL and userId are required' });
    }

    try {
        // const urlParts = url.split('/');
        // const key = urlParts.slice(3).join('/');

        // const s3Params = {
        //     Bucket: "kartavyavivahbandhanstorage",
        //     Key: key,
        // };
        // await s3.deleteObject(s3Params).promise();

        // Save the URL to the DeletePhotoUrls collection
        const deletePhotoUrl = new DeletePhotoUrls({ url, userId });
        await deletePhotoUrl.save();

        // Remove the URL from the user's profilePictureUrls array
        const user = await User.findOneAndUpdate(
            { userId },
            { $pull: { profilePictureUrls: url } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error marking file for deletion:', error.message);
        res.status(500).json({ error: 'Failed to mark file for deletion' });
    }
};
