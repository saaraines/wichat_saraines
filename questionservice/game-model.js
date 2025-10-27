const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    questions: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        question: String,
        correctAnswer: String,
        userAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number, // segundos que tardó en responder
        timedOut: Boolean  // si se le acabó el tiempo
    }],
    totalQuestions: {
        type: Number,
        default: 5
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    incorrectAnswers: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;