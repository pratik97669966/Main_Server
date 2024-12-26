const mongoose = require('mongoose');
const fs = require('fs');
const ProfileView = require('./models/ProfileView.js'); // Ensure this path is correct

const MONGODB_URI_NEW = 'mongodb+srv://sandipshelke203:sandipshelke203@data.l6eak.mongodb.net/?retryWrites=true&w=majority&appName=Data';

mongoose.connect(MONGODB_URI_NEW, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('New MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const migrateProfileViews = async () => {
    try {
        const rawData = fs.readFileSync('./viewcontact_details.json'); // Adjust the path as needed
        const oldProfileViews = JSON.parse(rawData);
        const newProfileView = {};

        for (const oldView of oldProfileViews) {
            if (oldView.date && oldView.who && oldView.whom && oldView.status) {
                const viewerId = oldView.who;
                const viewedUserId = oldView.whom;

                if (!newProfileView[viewerId]) {
                    newProfileView[viewerId] = {};
                }

                newProfileView[viewerId][viewedUserId] = {
                    viewContactStatus: oldView.status === 'Accept' ? 'VIEWED' : oldView.status === 'Pending' ? 'REQUESTED' : 'REJECTED',
                    viewContactTargetUserId: viewedUserId,
                    viewContactUserId: viewerId,
                    date: new Date(oldView.date) // Convert date to ISO format
                };
                const newView = {
                    viewContactUserId: oldView.who,
                    viewContactTargetUserId: oldView.whom,
                    viewContactStatus: oldView.status === 'Accept' ? 'VIEWED' : oldView.status === 'Pending' ? 'REQUESTED' : 'REJECTED',
                    date: new Date(oldView.date) // Convert date to ISO format
                };
                // const profileViewRecord = new ProfileView(newView);
                // await profileViewRecord.save();
            } else {
                console.error('Invalid data for viewId:', oldView.view_id);
            }
        }
        fs.writeFileSync('./newViewContactFirebase.json', JSON.stringify(newProfileView, null, 2));
        console.log('Profile views migration complete.');
    } catch (err) {
        console.error('Profile views migration error:', err);
    }
};

migrateProfileViews();