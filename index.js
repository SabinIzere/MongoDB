import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Book from "./models/Book.js";

dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB - Book Store Database");
  } catch (err) {
    console.error(" MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Home route
app.get("/", (req, res) => {
  res.json({ 
    message: " Welcome to Book Store API",
    version: "1.0.0",
    endpoints: {
      "GET /books": "Get all books",
      "GET /books/:id": "Get single book by ID",
      "GET /books/search/:query": "Search books by title or author",
      "POST /books": "Create new book",
      "PUT /books/:id": "Update book by ID",
      "DELETE /books/:id": "Delete book by ID"
    }
  });
});

// ========== CRUD OPERATIONS ==========

// CREATE - Add a new book
app.post("/books", async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();
    res.status(201).json({
      success: true,
      message: "Book added to store successfully",
      book: savedBook
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: "Error adding book to store", 
      error: err.message 
    });
  }
});

// READ - Get all books
app.get("/books", async (req, res) => {
  try {
    const books = await Book.find().sort({ addedDate: -1 });
    res.json({
      success: true,
      count: books.length,
      books: books
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// READ - Get book by ID
app.get("/books/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: "Book not found in store" 
      });
    }
    res.json({
      success: true,
      book: book
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// READ - Search books by title or author
app.get("/books/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const books = await Book.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } }
      ]
    });
    res.json({
      success: true,
      count: books.length,
      searchQuery: query,
      books: books
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// READ - Get books by genre
app.get("/books/genre/:genre", async (req, res) => {
  try {
    const books = await Book.find({ 
      genre: { $regex: req.params.genre, $options: 'i' } 
    });
    res.json({
      success: true,
      genre: req.params.genre,
      count: books.length,
      books: books
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// READ - Get available books only
app.get("/books/available/true", async (req, res) => {
  try {
    const books = await Book.find({ available: true, stock: { $gt: 0 } });
    res.json({
      success: true,
      count: books.length,
      books: books
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// UPDATE - Update book by ID
app.put("/books/:id", async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ 
        success: false,
        message: "Book not found in store" 
      });
    }
    res.json({
      success: true,
      message: "Book updated successfully",
      book: updatedBook
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: "Error updating book", 
      error: err.message 
    });
  }
});

// UPDATE - Update stock quantity
app.patch("/books/:id/stock", async (req, res) => {
  try {
    const { quantity } = req.body;
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: "Book not found" 
      });
    }

    book.stock = quantity;
    book.available = quantity > 0;
    await book.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      book: book
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: "Error updating stock", 
      error: err.message 
    });
  }
});

// DELETE - Delete book by ID
app.delete("/books/:id", async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ 
        success: false,
        message: "Book not found in store" 
      });
    }
    res.json({ 
      success: true,
      message: "Book removed from store successfully",
      book: deletedBook
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// DELETE - Delete all books (use carefully!)
app.delete("/books", async (req, res) => {
  try {
    const result = await Book.deleteMany({});
    res.json({ 
      success: true,
      message: `${result.deletedCount} books removed from store`
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Book Store Server running on http://localhost:${PORT}`);
  console.log(` Database: bookStoreDB on 'books' cluster`);
});