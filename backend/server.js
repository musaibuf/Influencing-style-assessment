const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'submissions.json');

app.use(cors());
app.use(express.json());

// Make sure the data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// POST — save a submission
app.post('/api/submit-influencing', (req, res) => {
    try {
        const { name, organization, responses } = req.body;

        if (!name || !organization || !responses) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const existing = JSON.parse(fs.readFileSync(DATA_FILE));

        const entry = {
            id: Date.now(),
            submittedAt: new Date().toISOString(),
            name,
            organization,
            responses,
        };

        existing.push(entry);
        fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));

        res.status(200).json({ message: 'Submission saved.' });

    } catch (err) {
        console.error('Error saving submission:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET — view all submissions
app.get('/api/results', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE));
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Could not read submissions.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});