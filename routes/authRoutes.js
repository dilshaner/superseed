// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { getUserByUsername, createUser, verifyPassword } = require('../db/db.js');

// Signup route
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    try {
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists.' });
        }

        await createUser(username, password);
        res.status(201).json({ success: true, message: 'Account created successfully.' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    try {
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        // Return user data (excluding the password)
        res.status(200).json({
            success: true,
            user: {
                username: user.username,
                resources: user.resources,
                loans: user.loans
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
});

module.exports = router;