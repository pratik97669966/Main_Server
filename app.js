const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler'); // If using
const path = require('path');



// Load environment variables
dotenv.config();

const app = express();
// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/', userRoutes); // Prefix routes with /api
app.use('/android/:userId', (req, res) => {
    const userId = req.params.userId;
    // Construct the deep link URL
    const deepLinkUrl = `kartavyavivahbandhan://user/${userId}`;

    // Redirect the user to the deep link
    res.redirect(deepLinkUrl);
});
app.get('/privacypolicy', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'privacy_policy.html');
    res.sendFile(filePath);
});
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error Handling Middleware (if using)
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
