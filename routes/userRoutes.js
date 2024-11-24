const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User Management
router.post('/user', userController.createNewUser); // Create a new user
router.put('/user', userController.updateUser); // Update a user's information
router.get('/user/:userId', userController.getUserById); // Get user by ID
router.get('/users', userController.getAllUsers); // Get all users
router.get('/users/gender/:gender', userController.getUsersByGender); // Get users by gender
router.delete('/user/:userId', userController.deleteUser); // Delete a user

// Profile Management
router.post('/profile/view', userController.viewProfile); // View a profile
router.get('/profile/viewed/:userId', userController.getMyViewedProfiles); // Profiles the user has viewed
router.get('/profile/viewers/:userId', userController.getWhoViewedProfile); // Who viewed the user's profile

// Interest Management
router.post('/interest', userController.showInterest); // Show interest in another user
router.get('/interests/received/:userId', userController.getInterestsRecived); // Interests received by user
router.get('/interests/sent/:userId', userController.getInterestsSend); // Interests sent by user

// Contacts Management
router.post('/contact', userController.myContacts); // Add a contact
router.get('/contacts/:userId', userController.getMyContacts); // Get contacts of a user
router.post('/contacts/profiles', userController.getMyContactsProfiles); // Get contact profiles

// Block Management
router.post('/block', userController.blockUser); // Block a user
router.get('/blocks/:userId', userController.getBlockedUsers); // Get blocked users

// Statistics and Counts
router.get('/counts/:userId', userController.getCounts); // Get statistics and counts


module.exports = router;
