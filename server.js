const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb+srv://gunjalpatilmisal:gunjalpatilmisal@cluster0.0oj7f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(bodyParser.json());

const corsOptions = {
  origin: 'http://localhost:9898',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Use the CORS options

// Define the User schema and model
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  firtName: String,
  lastName: String,
  dateOfBirth: String,
  address: String,
  landmark: String,
  comboPack: String,
  paymentStatus: String,
  totalAmound: String,
  paidAmount: String,
  transactionId: String,
  transactionStatus: String,
  note: String,
});

const loginUserSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  firtName: String,
  lastName: String,
  dateOfBirth: String,
  loginTime: String,
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  quantity: Number,
  minQuantity: Number
});

const User = mongoose.model('User', userSchema);
const LoginUser = mongoose.model('LoginUser', loginUserSchema);
const Product = mongoose.model('Product', productSchema);

// Create a new login user
app.post('/createloginuser', async (req, res) => {
  try {
    const userData = req.body;
    const { phone } = userData;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = new LoginUser(userData);
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a new product
app.post('/addproduct', async (req, res) => {
  try {
    const productData = req.body;
    const data = new Product(productData);
    await data.save();
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new user
app.post('/createnewuser', async (req, res) => {
  try {
    const userData = req.body;
    const { phone } = userData;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a user
app.put('/updateuser', async (req, res) => {
  const userData = req.body;
  const { phone } = userData;
  try {
    const user = await User.findOneAndUpdate({ phone }, userData, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a user by phone number
app.get('/users/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
app.get('/getallusers', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all login users
app.get('/getallloginusers', async (req, res) => {
  try {
    const users = await LoginUser.find();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all products
app.get('/getallproducts', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a user by phone number
app.delete('/users/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const user = await User.findOneAndDelete({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
