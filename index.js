require('dotenv').config();
const User = require('./models/User');
const Media = require('./models/Media');
const Banner = require('./models/Banner');
const movieRoutes = require('./routes/admin/movieRoutes');
const showRoutes = require('./routes/admin/showRoutes');
const shortsRoutes = require('./routes/admin/shortsRoutes');
const audioRoutes = require('./routes/admin/audioRoutes');
const assetRoutes = require('./routes/admin/assetRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/user/userRoutes');
const cors = require('cors');
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

connectDB();

const app = express();

// 🌐 UNIVERSAL CORS CONFIGURATION (Full Preflight & Origin Support)
app.use(cors({
    origin: true, // Reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Explicit Preflight Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());

// 📝 REQUEST LOGGER (For Divine Monitoring)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🛡️ ADVANCED DATA OBFUSCATION (Ultimate Privacy Layer)
const SALT = "MK_SEC_2024_"; // Secure Salt Prefix

app.use((req, res, next) => {
    // 🛡️ 1. DECODE INCOMING REQUESTS (Shield Engine)
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        if (req.body._q) {
            try {
                const reversed = req.body._q.split('').reverse().join('');
                const decoded = Buffer.from(reversed, 'base64').toString('utf8');

                if (decoded.startsWith(SALT)) {
                    const payload = decoded.substring(SALT.length);
                    req.body = JSON.parse(payload);
                } else {
                    console.warn("[SECURITY] Salt mismatch on path:", req.path);
                }
            } catch (e) {
                console.error("[SECURITY] Decode Error:", e.message);
            }
        }
    }

    // 🔒 2. ENCODE OUTGOING RESPONSES (Cloak Engine)
    const originalJson = res.json;
    res.json = function (data) {
        // Only obfuscate User and Auth APIs to prevent global overhead
        // EXEMPT admin-login and admin-register from obfuscation
        const isAdminAuth = req.path.includes('admin-login') || req.path.includes('admin-register');

        if (!isAdminAuth && (req.path.startsWith('/api/user') || req.path.startsWith('/api/auth'))) {
            // Don't obfuscate if it's already an obfuscated object (re-entrancy check)
            if (data && data._s) return originalJson.call(this, data);

            const saltedJson = SALT + JSON.stringify(data);
            const base64 = Buffer.from(saltedJson).toString('base64');
            const reversed = base64.split('').reverse().join('');
            return originalJson.call(this, { _s: reversed });
        }
        return originalJson.call(this, data);
    };
    next();
});

// Admin Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/movies', movieRoutes);
app.use('/api/admin/shows', showRoutes);
app.use('/api/admin/shorts', shortsRoutes);
app.use('/api/admin/audio', audioRoutes);
app.use('/api/admin/assets', assetRoutes);

// User/Auth Routes
const notificationRoutes = require('./routes/user/notificationRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user/notifications', notificationRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => { });
