const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Sequence = require('./models/Sequence'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 3030;
const MONGODB_URI = 'mongodb+srv://test:test@api.vyp94tn.mongodb.net/?retryWrites=true&w=majority&appName=API';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(bodyParser.json());

// Define the User schema and model
const userSchema = new mongoose.Schema({
  status: String,
  membershipPlan: String,
  numberOfContacts: Number,
  activationDate: String,
  expiryDate: String,
  userId: String,
  name: String,
  phone: String,
  country: String,
  state: String,
  city: String,
  profileCreatedFor: String,
  profilePictureUrls: [String],
  gender: String,
  religion: String,
  caste: String,
  subCaste: String,
  maritalStatus: String,
  dateOfBirth: String,
  age: String,
  email: String,
  password: String,
  referByName: String,
  aboutMe: String,
  education: String,
  educationDetails: String,
  employedIn: String,
  occupation: String,
  occupationDetails: String,
  annualIncome: String,
  incomeType: String,
  anyOtherSourceIncome: String,
  workingHours: String,
  workingLocationCity: String,
  workingExperience: String,
  workingExperienceDetails: String,
  lookingFor: String,
  partnerAgeRange: String,
  partnerHeightRange: String,
  partnerIncomeRange: String,
  partnerComplexion: String,
  partnerDiet: String,
  expectedEducation: String,
  partnerOccupation: String,
  partnerReligion: String,
  partnerCaste: String,
  partnerSubCaste: String,
  readyToMarryInSameCaste: String,
  partnerCountryLivingIn: String,
  partnerState: String,
  preferredWorkingCities: String,
  preferredNativeCities: String,
  partnerExpectations: String,
  familyValues: String,
  familyType: String,
  familyStatus: String,
  motherTongue: String,
  numberOfBrothers: String,
  numberOfSisters: String,
  numberOfBrothersMarried: String,
  numberOfSistersMarried: String,
  fatherName: String,
  fatherOccupation: String,
  fatherAlive: String,
  motherName: String,
  motherOccupation: String,
  motherAlive: String,
  parentsStay: String,
  nativeCountry: String,
  nativeState: String,
  nativeDistrict: String,
  nativeCity: String,
  currentCountry: String,
  currentState: String,
  currentDistrict: String,
  currentCity: String,
  mamaName: String,
  mamaCity: String,
  familyWealth: String,
  familyWealthDetails: String,
  surnamesOfRelatives: String,
  aboutFamily: String,
  address: String,
  contactCountry: String,
  contactState: String,
  contactDistrict: String,
  contactCity: String,
  alternatePhone: String,
  mobile: String,
  whatsappNo: String,
  height: String,
  weight: Number,
  bloodGroup: String,
  complexion: String,
  bodyType: String,
  diet: String,
  anyAchievement: String,
  specialCases: String,
  doYouHavePassport: String,
  cardType: String,
  moonsign: String,
  star: String,
  gotra: String,
  devak: String,
  manglik: String,
  shani: String,
  gan: String,
  nadi: String,
  charan: String,
  horoscopeMatch: String,
  placeOfBirth: String,
  birthCountry: String,
  timeOfBirth: String,
  hobbies: String,
  interests: String
});

// Function to generate a new userId
const generateUserId = async (prefix) => {
  let sequence = await Sequence.findOne({ prefix });

  if (!sequence) {
    sequence = new Sequence({ prefix, sequence: 0 });
  }

  sequence.sequence += 1;
  await sequence.save();

  return `${prefix}${String(sequence.sequence).padStart(6, '0')}`; // Adjust padding as needed
};

const User = mongoose.model('User', userSchema);

// Create a new user
app.post('/users', async (req, res) => {
  try {
    const { prefix, ...userData } = req.body;

    if (!prefix) {
      return res.status(400).json({ message: 'Prefix is required' });
    }

    const userId = await generateUserId(prefix);

    const user = new User({ ...userData, userId });
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a user
app.put('/users', async (req, res) => {
  const userData = req.body;
  const { userId } = userData;
  try {
    const user = await User.findOneAndUpdate({ userId }, userData, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a user by userId
app.get('/users/:userId', async (req, res) => {
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
});

// Get all users
app.get('/users/all', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a user
app.delete('/users', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOneAndDelete({ userId });
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
