const express = require('express');
const errorHandler = require('./middleware/errorHandler'); // If using
const app = express();


app.use('/qr/:userId', (req, res) => {
    const userId = req.params.userId;

    // Construct the deep link URL
    const deepLinkUrl = `dukanbikan://user/${userId}`;

    // Construct the Play Store URL
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.deal2funservice&hl=en_IN';

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

// app.use((req, res) => {
//     // Construct the Play Store URL
//     const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.deal2funservice&hl=en_IN';

//     // Serve an HTML page to handle the redirection logic
//     const htmlContent = `
//         <html>
//         <head>
//             <script type="text/javascript"> 
//             window.location.href = "${playStoreUrl}";
//             </script>
//         </head>
//         <body>
//             <p>If you are not redirected, <a href="${playStoreUrl}">click here to open in Play Store</a>.</p>
//         </body>
//         </html>
//     `;

//     res.send(htmlContent);
// });
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
