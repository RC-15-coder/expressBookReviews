const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// >>> Added for Tasks 10–13
const axios = require('axios');
const BASE_URL = "http://localhost:5000";

// ---------------------
// Task 6: Register user
// ---------------------
public_users.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  // Username already exists?
  const exists = users.some(u => u.username === username);
  if (exists) {
    return res.status(409).json({ message: "Username already exists" });
  }
  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// ---------------------
// Task 1: All books
// ---------------------
public_users.get('/', function (req, res) {
  return res.status(200).send(JSON.stringify(books, null, 2));
});

// ---------------------
// Task 2: Book by ISBN
// ---------------------
public_users.get('/isbn/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book, null, 2));
});

// ---------------------
// Task 3: Books by author
// ---------------------
public_users.get('/author/:author', function (req, res) {
  const author = (req.params.author || "").toLowerCase();
  const result = Object.keys(books)
    .filter(key => (books[key].author || "").toLowerCase() === author)
    .map(key => ({ isbn: key, ...books[key] }));
  if (!result.length) return res.status(404).json({ message: "No books for this author" });
  return res.status(200).send(JSON.stringify(result, null, 2));
});

// ---------------------
// Task 4: Books by title
// ---------------------
public_users.get('/title/:title', function (req, res) {
  const title = (req.params.title || "").toLowerCase();
  const result = Object.keys(books)
    .filter(key => (books[key].title || "").toLowerCase() === title)
    .map(key => ({ isbn: key, ...books[key] }));
  if (!result.length) return res.status(404).json({ message: "No books with this title" });
  return res.status(200).send(JSON.stringify(result, null, 2));
});

// ---------------------
// Task 5: Reviews by ISBN
// ---------------------
public_users.get('/review/:isbn', function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews || {}, null, 2));
});

/* =========================================================
   Tasks 10–13 (async using Axios)
   New endpoints that call the existing ones asynchronously.
   Take screenshots of THIS code for peer review:
   - task10.png  -> /async/books   (async/await)
   - task11.png  -> /async/isbn/:isbn (Promises .then/.catch)
   - task12.png  -> /async/author/:author (async/await)
   - task13.png  -> /async/title/:title (Promise wrapper)
   ========================================================= */

// Task 10: Get all books (async/await + Axios)
public_users.get('/async/books', async (req, res) => {
  try {
    const resp = await axios.get(`${BASE_URL}/`);
    // resp.data may be a string because original route sends a JSON string
    return res.status(200).send(resp.data);
  } catch (err) {
    return res.status(err.response?.status || 500)
              .json(err.response?.data || { message: "Error fetching books" });
  }
});

// Task 11: Get book by ISBN (Promises)
public_users.get('/async/isbn/:isbn', (req, res) => {
  const { isbn } = req.params;
  axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then(resp => res.status(200).send(resp.data))
    .catch(err => {
      res.status(err.response?.status || 500)
         .json(err.response?.data || { message: "Error fetching book by ISBN" });
    });
});

// Task 12: Get books by author (async/await)
public_users.get('/async/author/:author', async (req, res) => {
  try {
    const author = encodeURIComponent(req.params.author);
    const resp = await axios.get(`${BASE_URL}/author/${author}`);
    return res.status(200).send(resp.data);
  } catch (err) {
    return res.status(err.response?.status || 500)
              .json(err.response?.data || { message: "Error fetching by author" });
  }
});

// Task 13: Get books by title (Promise wrapper)
public_users.get('/async/title/:title', (req, res) => {
  const title = encodeURIComponent(req.params.title);
  new Promise((resolve, reject) => {
    axios.get(`${BASE_URL}/title/${title}`).then(resolve).catch(reject);
  })
    .then(resp => res.status(200).send(resp.data))
    .catch(err => {
      res.status(err.response?.status || 500)
         .json(err.response?.data || { message: "Error fetching by title" });
    });
});

module.exports.general = public_users;
