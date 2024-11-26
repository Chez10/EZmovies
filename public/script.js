const movieSearchBox = document.getElementById('movie-search-box');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');
require('dotenv').config();
const API_KEY = process.env.API_KEY;



async function fetchFromAPI(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('API request failed');
        return await res.json();
    } catch (error) {
        console.error('Error fetching from API:', error);
        alert('Failed to fetch data. Please try again.');
    }
}

async function getMovies(searchTerm) {
    const URL = `https://omdbapi.com/?s=${searchTerm}&page=1&apikey=${API_KEY}`;
    const data = await fetchFromAPI(URL);
    if (data?.Response === "True") showList(data.Search);
}

function searchMovie() {
    const searchTerm = movieSearchBox.value.trim();
    if (searchTerm.length > 0) {
        searchList.classList.remove('hide-search-list');
        getMovies(searchTerm);
    } else {
        searchList.classList.add('hide-search-list');
    }
}

function showList(movies) {
    searchList.innerHTML = "";
    movies.forEach(movie => {
        const movieListItem = document.createElement('div');
        movieListItem.dataset.id = movie.imdbID;
        movieListItem.classList.add('search-list-item');

        const moviePoster = movie.Poster !== "N/A" ? movie.Poster : "image-not-found.jpg";
        movieListItem.innerHTML = `
            <div class="search-item-thumbnail">
                <img src="${moviePoster}" alt="${movie.Title}">
            </div>
            <div class="search-item-info">
                <h3>${movie.Title}</h3>
                <p>${movie.Year}</p>
            </div>
        `;
        searchList.appendChild(movieListItem);
    });
    movieInfoLoad();
}

function movieInfoLoad() {
    const searchListMovies = searchList.querySelectorAll('.search-list-item');
    searchListMovies.forEach(movie => {
        movie.addEventListener('click', async () => {
            searchList.classList.add('hide-search-list');
            movieSearchBox.value = "";

            const result = await fetchFromAPI(
                `https://www.omdbapi.com/?i=${movie.dataset.id}&apikey=${API_KEY}`
            );
            if (result) movieInformation(result);
        });
    });
}

function movieInformation(details) {
    console.log('Rendering movie details:', details); 
    resultGrid.innerHTML = `
    <div class="movie-poster">
        <img src="${details.Poster !== "N/A" ? details.Poster : "image-not-found.jpg"}" alt="movie poster">
    </div>
    <div class="movie-info">
        <h3 class="movie-title">${details.Title}</h3>
        <ul class="movie-misc-info">
            <li class="year">Year: ${details.Year}</li>
            <li class="rated">Ratings: ${details.Rated}</li>
            <li class="released">Released: ${details.Released}</li>
        </ul>
        <p class="genre"><b>Genre:</b> ${details.Genre}</p>
        <p class="writer"><b>Writer:</b> ${details.Writer}</p>
        <p class="actors"><b>Actors:</b> ${details.Actors}</p>
        <p class="plot"><b>Plot:</b> ${details.Plot}</p>
        <p class="language"><b>Language:</b> ${details.Language}</p>
        <p class="awards"><b><i class="fa-solid fa-trophy"></i></b> ${details.Awards}</p>
        <button id="save-movie-btn" data-movie='${JSON.stringify(details)}'>Save Movie</button>
    </div>
    `;
    addSaveMovieListener(); 
}


function addSaveMovieListener() {
    const saveButton = document.getElementById('save-movie-btn');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const movieData = JSON.parse(saveButton.dataset.movie);

            try {
                const response = await fetch('/save-movie', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        movieId: movieData.imdbID,
                        title: movieData.Title,
                        poster: movieData.Poster,
                        releaseDate: movieData.Released,
                        overview: movieData.Plot,
                    }),
                });

                const result = await response.json();
                if (response.ok) {
                    alert('Movie saved successfully!');
                } else {
                    alert(`Failed to save movie: ${result.error}`);
                }
            } catch (error) {
                console.error('Error saving movie:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
}



async function loginUser() {
    const name = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('userId', data.userId);
            alert('Login successful!');
        } else {
            alert(`Login failed: ${data.error}`);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('An error occurred. Please try again.');
    }
}

async function fetchSavedMovies() {
    try {
        const response = await fetch('/get-saved-movies');
        if (response.ok) {
            const savedMovies = await response.json();

            const resultGrid = document.getElementById('result-grid');
            resultGrid.innerHTML = ''; 

            savedMovies.forEach((movie) => {
                const movieElement = document.createElement('div');
                movieElement.classList.add('movie-item');
                movieElement.innerHTML = `
                    <div class="movie-poster">
                        <img src="${movie.movieId.poster}" alt="${movie.movieId.title}">
                    </div>
                    <div class="movie-info">
                        <h3>${movie.movieId.title}</h3>
                        <p>${movie.movieId.releaseDate}</p>
                        <p>${movie.movieId.overview}</p>
                    </div>
                `;
                resultGrid.appendChild(movieElement);
            });
        } else {
            console.error('Failed to fetch saved movies:', await response.json());
        }
    } catch (error) {
        console.error('Error fetching saved movies:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchSavedMovies(); 
});






window.addEventListener('click', (event) => {
    if (event.target.className !== "form-control") {
        searchList.classList.add('hide-search-list');
    }
});
