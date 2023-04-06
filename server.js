const admin = require('firebase-admin');
const express = require('express');
const moment = require('moment');
const bodyParser = require('body-parser');
const app = express();
const cron = require("node-cron");

const port = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
const serviceAccount = require('./KEY.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://open-talk-test-default-rtdb.firebaseio.com'
});

// Parse request bodies as JSON
app.use(bodyParser.json());

// API endpoint to send notification to all devices subscribed to a topic
app.post('/send-notification', async (req, res) => {
  const { title, body, topic } = req.body;
  const message = {
    notification: {
      title,
      body
    },
    topic: topic
  };

  const response = await admin.messaging().send(message);

  console.log(`${response.successCount} messages were sent successfully`);
  res.send(`${response.successCount} messages were sent successfully`);
});
// Schedule notification job
app.post('/schedule-notification', async (req, res) => {
  const { notifications } = req.body;

  if (!notifications) {
    return res.status(400).send('Invalid request body: notifications array is missing');
  }

  notifications.forEach((notification) => {
    const { title, body, topic1, time } = notification;
    const scheduleTime = moment(time, 'YYYY-MM-DD HH:mm:ss').format('mm HH DD MM *');

    cron.schedule(scheduleTime, async () => {
      const message = {
        notification: {
          title,
          body
        },
        topic: topic1
      };

      const response = await admin.messaging().send(message);
      console.log(`${response.successCount} messages were sent successfully`);
    });
  });

  res.send('Notifications scheduled successfully');
});


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
