require('dotenv').config();
const express = require("express");
const path = require("path");
const collection = require("./config");
const bcrypt = require('bcrypt');
const { rmSync } = require("fs");
const { Script } = require("vm");
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
//const Movie = require('./models/SavedMovie');
const Movie = require('./models/Movie'); // Movie model
const UserMovie = require('./models/UserMovie'); 
const User = require('./models/User'); 
const API_KEY = process.env.API_KEY;

const app = express();
app.use(bodyParser.json());
// convert data into json format
app.use(express.json());
// Static file
app.use(express.static("public"));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '..', 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET , 
    resave: false,
    saveUninitialized: false, 
    cookie: { secure: false } 
}));

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
            res.status(500).send({error: "Error logging out"});
        } else {
            
            res.clearCookie('connect.sid'); 
            res.json({redirect: "/login"});
        }
    });
});

app.get('/login', (req, res) => {
    
    res.render('login');
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    console.log('Request body:', req.body); 

    try {
        if (!username || !password) {
            return res.status(400).json({ error: 'Name and password are required' });
        }
        const existingUser = await User.findOne({ name: username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name: username, password: hashedPassword });
        await newUser.save();

        //res.status(201).json({ message: 'User registered successfully' });
        res.redirect('/');
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Login user 
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ name: username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Verify the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        req.session.userId = user._id;
        console.log('Session userId:', req.session.userId);
        console.log('Loaded API Key:', process.env.API_KEY);
        console.log('Loaded Secret Key:', process.env.SESSION_SECRET);

        //res.status(200).json({ message: 'Login successful', userId: user._id });
        res.render("home");
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




app.post('/save-movie', async (req, res) => {
    const { movieId, title, poster, releaseDate, overview } = req.body;

    const userId = req.session.userId;

    try {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Please log in' });
        }

        let movie = await Movie.findById(movieId);
        if (!movie) {
            movie = new Movie({ _id: movieId, title, poster, releaseDate, overview });
            await movie.save();
        }

        const existingUserMovie = await UserMovie.findOne({ userId, movieId });
        if (existingUserMovie) {
            return res.status(400).json({ error: 'Movie already saved!' });
        }
        const userMovie = new UserMovie({ userId, movieId });
        await userMovie.save();

        res.status(200).json({ message: 'Movie saved successfully!' });
    } catch (error) {
        console.error('Error saving movie:', error);
        res.status(500).json({ error: 'Failed to save movie' });
    }
});

app.get('/get-saved-movies/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userMovies = await UserMovie.find({ userId }).populate('movieId'); 

        res.status(200).json(userMovies);
    } catch (error) {
        console.error('Error retrieving saved movies:', error);
        res.status(500).json({ error: 'Failed to retrieve saved movies' });
    }
});

app.get('/get-saved-movies', async (req, res) => {
    const userId = req.session.userId;

    try {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: Please log in' });
        }

        const userMovies = await UserMovie.find({ userId }).populate('movieId'); 

        res.status(200).json(userMovies);
    } catch (error) {
        console.error('Error retrieving saved movies:', error);
        res.status(500).json({ error: 'Failed to retrieve saved movies' });
    }
});

app.get('/api/search', async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Search term is required' });
    }

    const API_KEY = process.env.API_KEY;
    try {
        const url = `https://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`;
        console.log('OMDB API URL:', url);

        const omdbResponse = await fetch(url);
        const data = await omdbResponse.json();

        if (data.Response === "True") {
            res.status(200).json(data);
        } else {
            res.status(404).json({ error: data.Error });
        }
    } catch (error) {
        console.error('Error fetching from OMDB API:', error);
        res.status(500).json({ error: 'Failed to fetch data from OMDB' });
    }
});


app.get('/api/movie', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Movie ID is required' });
    }

    const API_KEY = process.env.API_KEY;
    try {
        const url = `https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`;
        console.log('OMDB API URL for movie details:', url);

        const omdbResponse = await fetch(url);
        const data = await omdbResponse.json();

        if (data.Response === "True") {
            res.status(200).json(data);
        } else {
            res.status(404).json({ error: data.Error });
        }
    } catch (error) {
        console.error('Error fetching movie details from OMDB API:', error);
        res.status(500).json({ error: 'Failed to fetch movie details from OMDB' });
    }
});



const port = 8080;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
