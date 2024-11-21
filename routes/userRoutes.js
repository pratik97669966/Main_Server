const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/createnewuser', userController.createNewUser);
router.put('/updateuser', userController.updateUser);
router.get('/users/:userId', userController.getUserById);
router.get('/getallusers', userController.getAllUsers);
router.get('/getbygender/:gender', userController.getUsersByGender);
router.delete('/users/:userId', userController.deleteUser);

router.post('/viewProfile', userController.viewProfile);
router.post('/showInterest', userController.showInterest);
router.get('/getMyViewedProfile/:userId', userController.getMyViewedProfiles);
router.post('/blockUser', userController.blockUser);
router.get('/getBlockedUsers/:userId', userController.getBlockedUsers); // Single definition
router.get('/getWhoViewedProfile/:userId', userController.getWhoViewedProfile);
router.get('/getInterestsShownToMe/:userId', userController.getInterestsShownToMe);
router.get('/getCounts/:userId', userController.getCounts);

// My Contacts
router.post('/myContacts', userController.myContacts);
router.post('/getMyContactsProfiles', userController.getMyContactsProfiles);

module.exports = router;
