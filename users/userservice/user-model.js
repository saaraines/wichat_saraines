const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    // nuevo: tipo de usuario
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },

    // nuevo: bloqueado o no
    isBlocked: {
        type: Boolean,
        default: false
    },
    createdAt: {
      type: Date,
      default: Date.now, 
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User