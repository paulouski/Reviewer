require('dotenv').config();
const express = require('express');
const path = require('path');

// Path to project root (one level up from dev-server)
const projectRoot = path.resolve(__dirname, '..');
const port = process.env.PORT || 3000;

const app = express();

// API endpoint to provide dev configuration (API key from .env)
app.get('/api/dev-config', (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
        res.json({ apiKey: apiKey });
    } else {
        res.status(404).json({ error: 'API key not configured in .env file' });
    }
});

// Serve static files from project root
app.use(express.static(projectRoot));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});

app.listen(port, () => {
    console.log(`Starting dev server on http://localhost:${port}`);
    console.log(`Serving from: ${projectRoot}`);
    if (process.env.OPENAI_API_KEY) {
        console.log('API key loaded from .env file');
    } else {
        console.log('Warning: OPENAI_API_KEY not found in .env file');
    }
    console.log('Press Ctrl+C to stop the server\n');
});
