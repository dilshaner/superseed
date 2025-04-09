const bcrypt = require('bcryptjs');

// Hash a password
function hashPassword(password) {
    return bcrypt.hashSync(password, 8); // Hash with a salt round of 8
}

// Compare a password with a hash
function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

module.exports = { hashPassword, comparePassword };