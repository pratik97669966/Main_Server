const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// View Contact
router.post('/iwant', userController.iwant); // View contact

// Get all IWantCustomers with pagination
router.get('/iwantcustomers', userController.getAllIWantCustomers);

// Get customer records by business mobile number with pagination
router.get('/iwantcustomers/business/:businessMobile', userController.getCustomersByBusinessMobile);

// Get all businesses with customer count and pagination
router.get('/businesses', userController.getAllBusinessesWithCustomerCount);

module.exports = router;