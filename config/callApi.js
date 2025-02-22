const axios = require('axios');

const callApi = async (url, payload) => {
    try {
        const response = await axios.post(url, payload);
        return response.data;
    } catch (error) {
        console.error('Error calling API:', error.message);
        throw new Error('Failed to call API');
    }
};

module.exports = callApi;