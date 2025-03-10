const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// iwant Save customer record
router.post('/iwant', userController.iwant); // iwant is the function name in userController.js

// Get all IWantCustomers with pagination
router.get('/iwantcustomers', userController.getAllIWantCustomers);

// Get customer records by business mobile number with pagination
router.get('/iwantcustomers/business/:businessMobile', userController.getCustomersByBusinessMobile);

// Get all businesses with customer count and pagination
router.get('/businesses', userController.getAllBusinessesWithCustomerCount);

module.exports = router;