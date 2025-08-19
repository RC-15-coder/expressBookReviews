// router/auth_users.js
const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

const regd_users = express.Router();

// Shared in-memory users; general.js pushes into this
let users = [];

// true if username is NOT taken
const isValid = (username) => !users.some(u => u.username === username);

// true if user/pass match an existing user
const authenticatedUser = (username, password) =>
  users.some(u => u.username === username && u.password === password);

// ---------- Task 7: LOGIN (POST /customer/login) ----------
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = jwt.sign({ username }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "User successfully logged in", token: accessToken });
});

// ----- Task 8: ADD/MODIFY review (PUT /customer/auth/review/:isbn) -----
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const reviewText = req.query.review || req.body?.review;
  const username = req.session.authorization?.username;

  if (!username) return res.status(401).json({ message: "User not logged in" });
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (!reviewText) return res.status(400).json({ message: "Review text required" });

  if (!book.reviews) book.reviews = {};
  const isUpdate = Boolean(book.reviews[username]);
  book.reviews[username] = reviewText;

  return res.status(isUpdate ? 200 : 201).json({
    message: isUpdate ? "Review modified successfully" : "Review added successfully",
    reviews: book.reviews
  });
});

// ----- Task 9: DELETE review (DELETE /customer/auth/review/:isbn) -----
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const username = req.session.authorization?.username;

  if (!username) return res.status(401).json({ message: "User not logged in" });
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });

  if (book.reviews && book.reviews[username]) {
    delete book.reviews[username];
    return res.status(200).json({ message: "Review deleted successfully", reviews: book.reviews });
  }
  return res.status(404).json({ message: "No review by this user for this book" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
