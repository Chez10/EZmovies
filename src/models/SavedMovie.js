const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    _id: { type: String, required: true }, 
    title: { type: String, required: true }, 
    poster: { type: String }, 
    releaseDate: { type: String }, 
    overview: { type: String }, 
});

// Export the model
module.exports = mongoose.model('Movie', MovieSchema); 
