const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    _id: { type: String, required: true }, 
    title: { type: String, required: true },
    poster: { type: String },
    releaseDate: { type: String },
    overview: { type: String },
});

module.exports = mongoose.model('Movie', MovieSchema); 
