import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './errorHandler.js';
import AbortController from 'abort-controller';
import { upload, processCSV } from './csvParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use('/main', express.static(path.join(__dirname, '/main')));

// Proxy endpoint for authentication
app.post('/auth/token', async (req, res, next) => {
    const apiInstance = req.query.apiInstance || 'https://api.paradox.ai';
    try {
        const response = await fetch(`${apiInstance}/api/v1/public/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(req.body)
        });
        const data = await response.json();
        if (data.errors) {
            const err = new Error(data.errors[0].message);
            err.status = 401;
            throw err;
        } else {
            return res.send(data);
        }
    } catch (err) {
        return next(err);
    }
});


app.post('/upload', upload.single('file'), processCSV, async (req, res) => {
    // const results = [];
    // const columnName = 'long_id';

    const parsedData = req.parsedCSV;
    // const matchedFieldSet = req.matchedFieldSet;

    console.log("Parsed DATA:", parsedData);
    

    res.send({
        success: true,
        message: `File successfully uploaded.`,
        data: parsedData
    });
});

app.post('/update-status/:id', async (req, res, next) => {
    const authToken = req.headers.authorization;
    const candidateId = req.params.id;
    const { candidate_journey_status } = req.body;
    const apiInstance = req.query.apiInstance || 'https://api.paradox.ai';
    
    try {
        const response = await fetch(`${apiInstance}/api/v1/public/candidates/${candidateId}`, {
            method: 'PUT',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ candidate_journey_status })
        });
        const data = await response.json();
        if (data.errors) {
            const err = new Error(data.errors[0].message);
            throw err;
        } else {
            return res.send(data);
        }
    } catch (err) {
        return next(err);
    }
});

app.delete('/delete-candidate/:id', async (req, res, next) => {
    const authToken = req.headers.authorization;
    const candidateId = req.params.id;
    const apiInstance = req.query.apiInstance || 'https://api.paradox.ai';

    try {
        const response = await fetch(`${apiInstance}/api/v1/public/candidates/${candidateId}`, {
            method: 'DELETE',
            headers: { 'Authorization': authToken }
        });
        const data = await response.json();
        return res.send(data);
    } catch (err) {
        return next(err);
    }
});

app.post('/create-candidate', async (req, res, next) => {
    const authToken = req.headers.authorization;
    const apiInstance = req.query.apiInstance || 'https://api.paradox.ai';

    try {
        const response = await fetch(`${apiInstance}/api/v1/public/candidates`, {
            method: 'POST',
            headers: { 'Authorization': authToken },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        return res.send(data);
    } catch (err) {
        return next(err);
    }
});

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
