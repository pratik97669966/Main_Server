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
    accessKeyId: 'AKIA5WLTSZQIW4RH465S',
    secretAccessKey: '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',
    region: 'ap-south-1',
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
        // const compressedImageBuffer = await sharp(file.buffer)
        //     .resize({ width: 800 })
        //     .jpeg({ quality: 60 })
        //     .toBuffer();

        const s3Params = {
            Bucket: 'kartavyavivahbandhanstorage',
            Key: `${Date.now()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: 'image/jpeg',
        };

        // Upload to S3
        const data = await s3.upload(s3Params).promise();

        res.status(200).json({
            message: 'File uploaded successfully',
            url: data.Location,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: '' + error });
    }
});
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});
app.delete('/delete/image', async (req, res) => {
    const { url,userId } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Extract the key from the URL
        const urlParts = url.split('/');
        const key = urlParts.slice(3).join('/'); // Adjust the slice index based on your URL structure

        const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        };

        // Delete the object from S3
        await s3.deleteObject(s3Params).promise();

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error.message);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});
// Error Handling Middleware (if using)
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
