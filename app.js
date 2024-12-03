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
    
    // Construct the Play Store URL
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.kartavya.vivahbandhan'; // Replace with your app's package name

    // Serve an HTML page to handle the redirection logic
    const htmlContent = `
        <html>
        <head>
            <script type="text/javascript">
                // Try opening the deep link
                window.location.href = "${deepLinkUrl}";

                // After 2 seconds, redirect to Play Store if the app is not installed
                setTimeout(function() {
                    window.location.href = "${playStoreUrl}";
                }, 2000); // 2 seconds delay
            </script>
        </head>
        <body>
            <p>If you are not redirected, <a href="${playStoreUrl}">click here to open in Play Store</a>.</p>
        </body>
        </html>
    `;
    
    res.send(htmlContent);
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
