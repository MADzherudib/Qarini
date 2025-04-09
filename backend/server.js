/* const express = require('express');
const axios = require('axios');
const path = require('path');  // For serving static files
const fs = require('fs');  // To read and write the access token to a file
const app = express();
const port = 3000;

// Replace with your Zoom credentials
const CLIENT_ID = "oRHwlvL9R3yiaTIyxNpVwA";
const CLIENT_SECRET = "GDxV3a1EDIJQH6GdZ8GrUJ3nhHsEoVkP";
const REDIRECT_URI = "http://localhost:3000/zoom/callback";

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));  // Serve static files from root

// Store access token in a JSON file (you can change this logic to use a database for better security)
const TOKEN_FILE = './access_token.json';

// Function to get the stored token (if available)
function getStoredToken() {
    if (fs.existsSync(TOKEN_FILE)) {
        const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE));
        return tokenData.accessToken;
    }
    return null;
}

// Function to store the access token securely
function storeAccessToken(accessToken) {
    const tokenData = { accessToken };
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData));
}

// Step 1: Redirect user to Zoom OAuth
app.get('/zoom/auth', (req, res) => {
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
    res.redirect(authUrl);
});

// Step 2: Handle OAuth callback and exchange code for token
app.get('/zoom/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Authorization code not found");
    }

    try {
        const response = await axios.post('https://zoom.us/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            },
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET,
            },
        });

        const { access_token } = response.data;

        // Store the access token securely
        storeAccessToken(access_token);

        // Now, create the Zoom meeting
        const meetingResponse = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: "Tutoring Session",
                type: 2,  // Scheduled meeting
                start_time: "2025-04-10T10:00:00Z",  // Example time, adjust as necessary
                duration: 60,  // Default duration in minutes
                timezone: "UTC",
                agenda: "Tutoring session with student",
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: true,
                    mute_upon_entry: true,
                    audio: "voip",
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const meeting = meetingResponse.data;

        // Redirect the user to the Zoom meeting URL
        res.redirect(meeting.join_url);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error exchanging code for token or creating meeting");
    }
});

// Serve the index.html on root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html')); // Adjust path if needed
});

// Start the Express server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

*/


const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Replace with your Zoom credentials
const CLIENT_ID = "oRHwlvL9R3yiaTIyxNpVwA";
const CLIENT_SECRET = "GDxV3a1EDIJQH6GdZ8GrUJ3nhHsEoVkP";
const REDIRECT_URI = "http://localhost:3000/zoom/callback";

// Replace with your email credentials
const EMAIL_USER = "adem.djeroudib@gmail.com";
const EMAIL_PASS = "xengcfserglsblek";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// OAuth Flow - Redirect to Zoom OAuth page
app.get('/zoom/auth', (req, res) => {
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
    res.redirect(authUrl);
});

// Callback to handle Zoom OAuth authorization code and fetch access token
app.get('/zoom/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("Authorization code not found");
    }

    try {
        const response = await axios.post('https://zoom.us/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
            },
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET,
            },
        });

        const { access_token } = response.data;

        // Store the access token in a file (you can also use a database for security)
        fs.writeFileSync('./access_token.json', JSON.stringify({ accessToken: access_token }));

        // Redirect the user back to the home page or the next step
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error exchanging code for token");
    }
});

// Endpoint to handle form submission and Zoom meeting creation
app.post('/zoom/meeting', async (req, res) => {
    const { name, email, subject, date, time, teacherEmail } = req.body;

    if (!name || !email || !subject || !date || !time || !teacherEmail) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Get stored Zoom access token
    let accessToken = null;
    if (fs.existsSync('./access_token.json')) {
        const tokenData = JSON.parse(fs.readFileSync('./access_token.json'));
        accessToken = tokenData.accessToken;
    }

    if (!accessToken) {
        // If no token found, respond with the Zoom OAuth URL
        return res.json({ authUrl: `http://localhost:3000/zoom/auth` });
    }

    try {
        // Create Zoom meeting
        const response = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: `${subject} Tutoring Session`,
                start_time: `${date}T${time}:00Z`,
                type: 2, // Scheduled meeting
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const { join_url } = response.data;

        // Send email to student
        const emailContent = `
            Hi ${name},

            Your tutoring session has been scheduled.

            Subject: ${subject}
            Date: ${date}
            Time: ${time}

            Zoom Link: ${join_url}

            Regards,
            Online Tutoring Platform
        `;

        await transporter.sendMail({
            from: EMAIL_USER,
            to: email,
            subject: 'Your Tutoring Session Details',
            text: emailContent,
        });

        // Send email to teacher
        await transporter.sendMail({
            from: EMAIL_USER,
            to: teacherEmail,
            subject: `Tutoring Session Scheduled: ${subject}`,
            text: `A tutoring session has been scheduled.\n\nDetails:\n${emailContent}`,
        });

        res.json({ message: 'Meeting created and emails sent', meetingLink: join_url });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ message: "Error creating meeting or sending emails" });
    }
});

// Start the server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

