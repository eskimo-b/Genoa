const mongoose = require('mongoose');

const unionSchema = new mongoose.Schema({
    member1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    member2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },

    unionDate: Date,
    separationDate: Date

}, { timestamps: true });

module.exports = mongoose.model('Union', unionSchema);