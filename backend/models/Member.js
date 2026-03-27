const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },

    sex: { type: String, enum: ['M', 'F'] },

    birthDate: Date,
    deathDate: Date,

    profession: [String],

    photo: String,

    publicInfo: String,
    privateInfo: String,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);