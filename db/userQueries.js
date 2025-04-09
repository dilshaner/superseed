// db/userQueries.js
// User-related database queries

const db = require('./db');

// Fetch a user by username
function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Create a new user
function createUser(username, hashedPassword, resources) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO users (username, password, resources) VALUES (?, ?, ?)',
            [username, hashedPassword, JSON.stringify(resources)],
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Update user resources
function updateUserResources(username, resources) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET resources = ? WHERE username = ?',
            [JSON.stringify(resources), username],
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

module.exports = { getUserByUsername, createUser, updateUserResources };