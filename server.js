import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Proxy endpoint for authentication
app.post('/auth/token', async (req, res) => {
    console.log("Received body:", req.body);
    const response = await fetch('https://api.paradox.ai/api/v1/public/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(req.body)
    });

    const data = await response.json();
    res.send(data);
});

// Proxy endpoint for deleting a candidate
app.delete('/delete-candidate/:id', async (req, res) => {
    const authToken = req.headers.authorization;
    const candidateId = req.params.id;

    const response = await fetch(`https://api.paradox.ai/api/v1/public/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': authToken }
    });

    const data = await response.json();
    res.send(data);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
