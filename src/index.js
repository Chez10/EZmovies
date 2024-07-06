const express = require("express");
const path = require("path");
const collection = require("./config");
const bcrypt = require('bcrypt');
const { rmSync } = require("fs");
const { Script } = require("vm");
const session = require('express-session');

const app = express();
// convert data into json format
app.use(express.json());
// Static file
app.use(express.static("public"));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '..', 'views'));

app.use(session({
    secret: '1234', // Replace '1234' with a real secret key
    resave: false,
    saveUninitialized: false, // Only create a session when you explicitly set something on the session
    cookie: { secure: false } // Use 'true' only if you are using HTTPS
}));

app.use(express.urlencoded({ extended: true }));
//use EJS as the view engine
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
            // This line should instruct the browser to clear the session cookie
            res.clearCookie('connect.sid'); // Adjust if using a custom session cookie name
            res.json({redirect: "/login"});
        }
    });
});

app.get('/login', (req, res) => {
    // Render 'login.ejs' from the views directory
    res.render('login');
});



// Register User
app.post("/signup", async (req, res) => {

    const data = {
        name: req.body.username,
        password: req.body.password
    }

    // Password validation
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(data.password)) {
        return res.send('Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
    }

    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.');
    } else {
        // Hash the password using bcrypt
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword; // Replace the original password with the hashed one

        const userdata = await collection.insertMany(data);
        console.log(userdata);
        res.redirect('/');
    }

});

// Login user 
app.post("/login", async (req, res) => {
    try {
        // Assuming 'collection' is your user collection where you store user data
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            return res.send("User name cannot be found");
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            return res.send("Wrong password");
        }
        else {
            // If the user is authenticated, store user information in session
            // Assuming 'check' contains a unique identifier for the user, e.g., check._id
            req.session.userId = check._id; // Store the user's ID in the session

            // Redirect to home/dashboard page after successful login
            // 'res.render("home")' might be used to render a page directly
            // Consider using 'res.redirect("/dashboard")' if you want to navigate to a route that renders the home page
            res.render("home"); // or res.render("home") if you're rendering directly without redirection
        }
    } catch (error) {
        console.error("Login error:", error); // Log the error for debugging purposes
        res.send("Wrong details");
    }
});



// Define Port for Application
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
