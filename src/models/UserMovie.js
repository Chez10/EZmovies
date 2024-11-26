const mongoose = require('mongoose');


const UserMovieSchema = new mongoose.Schema({
    userId: { type: String, required: true }, 
    movieId: { type: String, ref: 'Movie', required: true },
    savedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserMovie', UserMovieSchema); 
