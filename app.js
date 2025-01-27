const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler'); // If using
const path = require('path');
const multer = require('multer');
const AWS = require('aws-sdk');
const sharp = require('sharp');

// Load environment variables
dotenv.config();

const app = express();
// Connect to MongoDB
connectDB();

// Configure AWS S3
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Middleware
app.use(bodyParser.json());
// Configure Multer for file uploads with a file size limit (e.g., 5MB)
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
});

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

app.post('/upload/image', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Compress the image using sharp
        const compressedImageBuffer = await sharp(file.buffer)
            .resize({ width: 800 })
            .jpeg({ quality: 60 })
            .toBuffer();

        const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${Date.now()}_${file.originalname}`,
            Body: compressedImageBuffer,
            ContentType: 'image/jpeg',
        };

        // Upload to S3
        const data = await s3.upload(s3Params).promise();

        res.status(200).json({
            message: 'File uploaded successfully',
            url: data.Location, // S3 file URL
        });
    } catch (error) {
        console.error('Error uploading file:', error); // Log the full error object
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error Handling Middleware (if using)
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
