const mongoose = require('mongoose');

const situationSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    child: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },

    isBiological: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Situation', situationSchema);