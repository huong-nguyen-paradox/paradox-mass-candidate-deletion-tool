import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
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
app.use(bodyParser.json())

// Express static file routing
app.use('/main', express.static(path.join(__dirname, '/main')));


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

const upload = multer({ dest: 'uploads/' }); 

app.post('/upload', upload.single('file'), (req, res) => {
    const results = [];
    const columnName = 'long_id';

    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data[columnName]))
      .on('end', () => {
        fs.unlinkSync(req.file.path); 
        res.json(results); // Send back the contents of the column
      });
});

// Endpoint to update status
app.post('/update-status/:id', async (req, res) => {
    console.log("Received body:", req.body);
    const authToken = req.headers.authorization;
    const candidateId = req.params.id
    const response = await fetch(`https://api.paradox.ai/api/v1/public/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 
            'Authorization': authToken,
            'Content-Type': 'application/json'
        },
        body: req.body
    });
    console.log(response);
    const data = response;
    res.send(data);
})

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
