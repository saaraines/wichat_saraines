const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    incorrectAnswers: {
        type: [String],
        required: true,
        validate: [array => array.length === 3, 'Must have exactly 3 incorrect answers']
    },
    category: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,  // Obligatorio, siempre debe tener imagen
    },
    wikidataId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;