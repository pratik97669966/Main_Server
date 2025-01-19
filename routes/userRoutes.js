const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User Management
router.post('/user', userController.createNewUser); // Create a new user
router.put('/user', userController.updateUser); // Update a user's information
router.get('/user/:userId', userController.getUserById); // Get user by ID
router.get('/user/last/seen/:userId', userController.setLastSeen); // Set user last seen
router.get('/users', userController.getAllUsers); // Get all users
router.get('/users/gender/:gender', userController.getUsersByGender); // Get users by gender
router.get('/matches/:userId/:gender/:lookingfor', userController.getUsersByFilter); // Get user matches
router.delete('/user/:userId', userController.deleteUser); // Delete a user
// Search upload/imageUser
router.post('/searchbyname', userController.searchByName); // Search By Name
// Unregister user
router.get('/unregister', userController.getUnregister); // Search By Name
// Profile Management
router.post('/profile/view', userController.viewProfile); // View a profile
router.get('/profile/viewed/:userId', userController.getMyViewedProfiles); // Profiles the user has viewed
router.get('/profile/viewers/:userId', userController.getWhoViewedProfile); // Who viewed the user's profile

// Interest Management
router.post('/interest', userController.showInterest); // Show interest in another user
router.get('/interests/received/:userId', userController.getInterestsRecived); // Interests received by user
router.get('/interests/sent/:userId', userController.getInterestsSend); // Interests sent by user

// ShortList Management
router.post('/shortlisted', userController.addShortlisted); // Show interest in another user
router.get('/shortlisted/sent/:userId', userController.getShortlisted); // Interests received by user
// router.get('/shortlisted/received/:userId', userController.getWhoShortlisted); // Interests received by user

// Contacts Management
router.post('/contact', userController.addContact); // Add a contact
router.get('/contacts/:userId', userController.getContacts); // Get contacts of a user
router.post('/contacts/remove', userController.removeContact); // Remove contact
// Block Management
router.post('/block', userController.blockUser); // Block a user
router.get('/blocks/:userId', userController.getBlockedUsers); // Get blocked users

// View Contact
router.post('/view/contact', userController.viewContact); // View contact
router.get('/view/contact/sent/:userId', userController.getViewContactSend); // View contact Send by user
router.get('/view/contact/received/:userId', userController.getViewContactReceived); // View contact received by user

// Statistics and Counts
router.get('/counts/:userId', userController.getCounts); // Get statistics and counts


module.exports = router;
