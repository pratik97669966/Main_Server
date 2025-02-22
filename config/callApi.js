const axios = require('axios');

const callApi = async (url, payload) => {
    try {
        const response = await axios.post(url, payload);
        return response.data;
    } catch (error) {
       
    }
};

module.exports = callApi;