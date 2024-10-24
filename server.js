// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Use CORS middleware
app.use(cors());
app.use(express.json());

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyy_EoIM7d0x5zK3ZH45oC_u9F_5T8tsqf7aCzGCcacZl9d0Kftg4Hjg6h4Flyl0Xxp/exec';

// Define your proxy endpoint for POST (Add Entry)
app.post('/data', async (req, res) => {
    try {
        const response = await axios.post(GOOGLE_APPS_SCRIPT_URL, req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Google Apps Script:', error);
        res.status(500).send('Error fetching data');
    }
});

// Define your proxy endpoint for GET (Get All Entries)
app.get('/data', async (req, res) => {
    try {
        const response = await axios.get(GOOGLE_APPS_SCRIPT_URL);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Google Apps Script:', error);
        res.status(500).send('Error fetching data');
    }
});

// Define your proxy endpoint for GET by ID (Get Entry by ID)
app.get('/data/:id', async (req, res) => {
    try {
        const response = await axios.get(`${GOOGLE_APPS_SCRIPT_URL}?id=${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Google Apps Script:', error);
        res.status(500).send('Error fetching data');
    }
});

// Define your proxy endpoint for PUT (Update Entry by ID)
app.put('/data/:id', async (req, res) => {
    try {
        const response = await axios.put(`${GOOGLE_APPS_SCRIPT_URL}?id=${req.params.id}`, req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error updating data in Google Apps Script:', error);
        res.status(500).send('Error updating data' + error);
    }
});

// Define your proxy endpoint for DELETE (Delete Entry by ID)
app.delete('/data/:id', async (req, res) => {
    try {
        const response = await axios.delete(`${GOOGLE_APPS_SCRIPT_URL}?id=${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error deleting data in Google Apps Script:', error);
        res.status(500).send('Error deleting data');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
