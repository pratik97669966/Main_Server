// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Use CORS middleware
app.use(cors());
app.use(express.json());

// Define your proxy endpoint
app.get('/data', async (req, res) => {
    try {
        const response = await axios.get('https://script.google.com/macros/s/AKfycbwcWqDV-pNAoBQkeUWPXQUrq6BdORvr5zeoiBz4lZurHnooOn_POC6HFloYk4p5p6_W/exec');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Google Apps Script:', error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
