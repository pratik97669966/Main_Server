const axios = require('axios');

const url = 'https://kartavya-user.onrender.com/getallusers'; // Replace with your server URL and endpoint

const callApi = async (i) => {
  try {
    const response = await axios.get(url);
    console.log('Response:', response.status + " - " + i);
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
  }
};

const runLoadTest = async () => {
  const requests = [];
  for (let i = 0; i < 2000; i++) {
    requests.push(callApi(i));

  }
  await Promise.all(requests);
  console.log('Load test completed');
};

runLoadTest();
