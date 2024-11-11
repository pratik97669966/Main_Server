const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/createnewuser', userController.createNewUser);
router.put('/updateuser', userController.updateUser);
router.get('/users/:userId', userController.getUserById);
router.get('/getallusers', userController.getAllUsers);
router.get('/getbygender/:gender', userController.getUsersByGender);
router.delete('/users/:userId', userController.deleteUser);

module.exports = router;
