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
   // Membership Details
    status: string,
    membershipPlan: string,
    numberOfContacts: number,
    activationDate: string,
    expiryDate: string,

    // User
    prefix: string,
    userId: string,
    name: string,
    phone: string,
    country: string,
    state: string,
    city: string,
    profileCreatedFor: string,
    profilePictureUrls: string[any],
    gender: string,
    religion: string,
    caste: string,
    subCaste: string,
    maritalStatus: string,
    dateOfBirth: string,
    age: string,
    email: string,
    password: string,
    referByName: string,
    aboutMe: string,

    // Education Details
    education: string,
    educationDetails: string,
    employedIn: string,
    occupation: string,
    occupationDetails: string,
    annualIncome: string,
    incomeType: string,
    anyOtherSourceIncome: string,
    workingHours: string,
    workingLocationCity: string,
    workingExperience: string,
    workingExperienceDetails: string,

    // Partner Preference
    lookingFor: string,
    partnerAgeRange: string,
    partnerHeightRange: string,
    partnerIncomeRange: string,
    partnerComplexion: string,
    partnerDiet: string,
    expectedEducation: string,
    partnerOccupation: string,
    partnerReligion: string,
    partnerCaste: string,
    partnerSubCaste: string,
    readyToMarryInSameCaste: string,
    partnerCountryLivingIn: string,
    partnerState: string,
    preferredWorkingCities: string,
    preferredNativeCities: string,
    partnerExpectations: string,

    // Family Details
    familyValues: string,
    familyType: string,
    familyStatus: string,
    motherTongue: string,
    numberOfBrothers: string,
    numberOfSisters: string,
    numberOfBrothersMarried: string,
    numberOfSistersMarried: string,
    fatherName: string,
    fatherOccupation: string,
    fatherAlive: string,
    motherName: string,
    motherOccupation: string,
    motherAlive: string,
    parentsStay: string,
    nativeCountry: string,
    nativeState: string,
    nativeDistrict: string,
    nativeCity: string,
    currentCountry: string,
    currentState: string,
    currentDistrict: string,
    currentCity: string,
    mamaName: string,
    mamaCity: string,
    familyWealth: string,
    familyWealthDetails: string,
    surnamesOfRelatives: string,
    aboutFamily: string,

    // Contact Information
    address: string,
    contactCountry: string,
    contactState: string,
    contactDistrict: string,
    contactCity: string,
    alternatePhone: string,
    mobile: string,
    whatsappNo: string,

    // Basics and Lifestyle
    height: string,
    weight: number,
    bloodGroup: string,
    complexion: string,
    bodyType: string,
    diet: string,
    anyAchievement: string,
    medicalHistory: string,
    specialCases: string,
    doYouHavePassport: string,
    cardType: string,

    // Horoscope Information
    moonsign: string,
    star: string,
    gotra: string,
    devak: string,
    manglik: string,
    shani: string,
    gan: string,
    nadi: string,
    charan: string,
    horoscopeMatch: string,
    placeOfBirth: string,
    birthCountry: string,
    timeOfBirth: string,

    // Hobbies and Interests
    hobbies: string,
    interests: string,
})

// Function to generate a new userId
const generateUserId = async (data) => {
  const prefix = 'lastUser';
  let sequence = await Sequence.findOne({ prefix });

  if (!sequence) {
    sequence = new Sequence({ prefix, sequence: 0 });
  }

  sequence.sequence += 1;
  await sequence.save();

  return `${data}${String(sequence.sequence)}`;
};

const User = mongoose.model('User', userSchema);

// Create a new user
app.post('/createnewuser', async (req, res) => {
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
app.put('/updateuser', async (req, res) => {
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
app.get('/getallusers', async (req, res) => {
  const { userId } = req.params;

  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all users
app.get('/getbygender/:gender', async (req, res) => {
  const { gender } = req.params;

  try {
    const users = await User.find({ gender });
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Delete a user
app.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;
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
