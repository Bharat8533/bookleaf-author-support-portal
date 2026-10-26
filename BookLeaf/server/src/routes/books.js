const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { protect, requireRole } = require('../middleware/auth');

router.get('/my-books', protect, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (req.user.role === 'author') {
      query = {
        $or: [
          { authorEmail: req.user.email },
          { authorId: req.user.authorId }
        ]
      };
    } else if (req.query.authorId) {
      query = { authorId: req.query.authorId };
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const searchConditions = [
        { title: { $regex: s, $options: 'i' } },
        { isbn: { $regex: s, $options: 'i' } },
        { genre: { $regex: s, $options: 'i' } }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const books = await Book.find(query).sort({ publicationDate: -1, createdAt: -1 });

    const totalRoyaltiesEarned = books.reduce((acc, b) => acc + (b.totalRoyaltyEarned || 0), 0);
    const totalRoyaltiesPaid = books.reduce((acc, b) => acc + (b.royaltyPaid || 0), 0);
    const totalRoyaltiesPending = books.reduce((acc, b) => acc + (b.royaltyPending || 0), 0);
    const totalCopiesSold = books.reduce((acc, b) => acc + (b.totalCopiesSold || 0), 0);

    return res.json({
      success: true,
      count: books.length,
      summary: {
        totalBooks: books.length,
        totalCopiesSold,
        totalRoyaltiesEarned,
        totalRoyaltiesPaid,
        totalRoyaltiesPending
      },
      books
    });
  } catch (error) {
    console.error('Error fetching author books:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve books.'
    });
  }
});

router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: books.length,
      books
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve catalog books.'
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    if (
      req.user.role === 'author' &&
      book.authorEmail !== req.user.email &&
      book.authorId !== req.user.authorId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view this book.'
      });
    }

    return res.json({
      success: true,
      book
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching book details.'
    });
  }
});

module.exports = router;
