const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    createdAt: Date,
    role: String,
    isBlocked: Boolean,
});

const User = mongoose.model('User', userSchema);

module.exports = User