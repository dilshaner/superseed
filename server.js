const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { setupSocketRoutes } = require('./routes/socketRoutes'); // Correct function name
const { initializeLeaderboardServer } = require('./leaderboardServer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000/', // Allow your frontend domain
        methods: ['GET', 'POST']
    }
});

// Initialize LeaderboardServer
const leaderboardServer = initializeLeaderboardServer(io);

// Pass io and leaderboardServer to socketRoutes
setupSocketRoutes(io, leaderboardServer); // Use setupSocketRoutes, not socketRoutes

// Store connected device IDs
const connectedDevices = new Map();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000/' // Match your frontend domain
}));

// Mobile detection middleware
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'].toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent);
    if (isMobile) {
        return res.status(403).sendFile(__dirname + '/mobile-blocked.html');
    }
    next();
});

// Serve static files with custom headers for audio
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mp3')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'audio/mpeg');
        }
    }
}));

// Routes
app.use('/api/auth', authRoutes);

// Setup WebSocket connection handling
io.on('connection', (socket) => {
    socket.setMaxListeners(100); // Increase max listeners to prevent warnings
    const deviceId = socket.handshake.address || socket.id;
    connectedDevices.set(deviceId, socket.id);

    socket.on('disconnect', () => {
        connectedDevices.delete(deviceId);
        // Clean up listeners to prevent MaxListenersExceededWarning
        socket.removeAllListeners('hireCharacter');
        socket.removeAllListeners('mineResource');
        socket.removeAllListeners('getUserData');
        socket.removeAllListeners('updateUserData');
        socket.removeAllListeners('updateResources');
        // Add any other event listeners defined in setupSocketRoutes if needed
    });

    setupSocketRoutes(io, socket);
});

// Export io and leaderboardServer after initialization
module.exports = { io, leaderboardServer }; // Moved to the end

// Start the server
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});