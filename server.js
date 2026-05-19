const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Open network security borders so your github.io frontend can transmit data securely
app.use(cors());

// Set high execution limits so base64 uploaded image blocks stream cleanly without a 413 error
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ACCOUNTS_FILE = path.join(__dirname, 'user_accounts.json');
const APPLICATIONS_FILE = path.join(__dirname, 'student_applications.json');

function readAccountsFromDisk() {
    try {
        if (!fs.existsSync(ACCOUNTS_FILE)) fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([]));
        return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8') || '[]');
    } catch (error) { return []; }
}

function writeAccountsToDisk(dataArray) {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(dataArray, null, 2));
}

function readApplicationsFromDisk() {
    try {
        if (!fs.existsSync(APPLICATIONS_FILE)) fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify([]));
        return JSON.parse(fs.readFileSync(APPLICATIONS_FILE, 'utf8') || '[]');
    } catch (error) { return []; }
}

function writeApplicationsToDisk(dataArray) {
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(dataArray, null, 2));
}

// LANDING ROUTE: This fixes the "Cannot GET /" and proves the server is active
app.get('/', (req, res) => {
    res.send("🚀 CvSU Bacoor Enrollment Engine is Online and Persisted to Disk Storage.");
});

// Authentication Node: Registration
app.post('/api/auth/register', (req, res) => {
    try {
        const accounts = readAccountsFromDisk();
        const { fullName, email, contact, password } = req.body;
        if (!fullName || !email || !password) return res.status(400).json({ success: false, error: "Missing parameters." });

        if (accounts.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return res.status(400).json({ success: false, error: "Email already registered." });
        }

        accounts.push({ fullName, email, contact, password });
        writeAccountsToDisk(accounts);
        res.json({ success: true, message: "Account profile committed to disk storage." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Internal server registry error." });
    }
});

// Authentication Node: Login
app.post('/api/auth/login', (req, res) => {
    try {
        const accounts = readAccountsFromDisk();
        const { username, password } = req.body;
        const user = accounts.find(u => u.email.toLowerCase() === username.trim().toLowerCase() && u.password === password);

        if (user) {
            res.json({ success: true, fullName: user.fullName, email: user.email });
        } else {
            res.status(401).json({ success: false, error: "Invalid credentials or password mismatch." });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: "Internal login engine error." });
    }
});

// Admissions: Form Submission
app.post('/api/submit', (req, res) => {
    try {
        const applications = readApplicationsFromDisk();
        const studentData = req.body;
        if (!studentData.email) return res.status(400).json({ success: false, error: "Missing email tracker identifier." });

        let filtered = applications.filter(app => app.email.toLowerCase() !== studentData.email.toLowerCase());
        filtered.push(studentData);
        writeApplicationsToDisk(filtered);
        res.json({ success: true, message: "Application saved permanently." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Internal database stream error." });
    }
});

// Admissions: Fetch Global Array
app.get('/api/applications', (req, res) => {
    res.json(readApplicationsFromDisk());
});

// Admissions: Update Evaluation State
app.post('/api/applications/update', (req, res) => {
    try {
        const applications = readApplicationsFromDisk();
        const { email, status } = req.body;
        let matched = false;
        const updated = applications.map(app => {
            if (app.email.toLowerCase() === email.toLowerCase()) { app.status = status; matched = true; }
            return app;
        });
        if (!matched) return res.status(404).json({ success: false, error: "Record tracker mismatch." });
        writeApplicationsToDisk(updated);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// Admissions: Purge Record Row
app.delete('/api/applications/delete', (req, res) => {
    try {
        const applications = readApplicationsFromDisk();
        const targetEmail = req.query.email;
        if (!targetEmail) return res.status(400).json({ success: false, error: "Missing parameter." });
        const filtered = applications.filter(app => app.email.toLowerCase() !== targetEmail.toLowerCase());
        writeApplicationsToDisk(filtered);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 ENGINE SECURELY ONLINE ON PORT: ${PORT} 🚀`);
});