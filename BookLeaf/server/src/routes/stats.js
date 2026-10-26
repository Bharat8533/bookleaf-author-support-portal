const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

router.get('/admin', protect, requireRole('admin'), async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
    const closedTickets = await Ticket.countDocuments({ status: 'Closed' });

    const criticalTickets = await Ticket.countDocuments({
      priority: 'Critical',
      status: { $in: ['Open', 'In Progress'] }
    });

    const highTickets = await Ticket.countDocuments({
      priority: 'High',
      status: { $in: ['Open', 'In Progress'] }
    });

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const overdueTickets = await Ticket.countDocuments({
      status: { $in: ['Open', 'In Progress'] },
      createdAt: { $lt: fortyEightHoursAgo }
    });

    const categoryStats = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const totalAuthors = await User.countDocuments({ role: 'author' });
    const totalBooks = await Book.countDocuments();

    return res.json({
      success: true,
      stats: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        criticalTickets,
        highTickets,
        overdueTickets,
        totalAuthors,
        totalBooks,
        categoryStats,
        priorityStats
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin queue statistics.'
    });
  }
});

router.get('/author', protect, async (req, res) => {
  try {
    const books = await Book.find({
      $or: [{ authorEmail: req.user.email }, { authorId: req.user.authorId }]
    });

    const totalBooks = books.length;
    const publishedBooks = books.filter((b) => b.status === 'Published & Live').length;
    const totalCopiesSold = books.reduce((sum, b) => sum + (b.totalCopiesSold || 0), 0);
    const totalRoyaltyEarned = books.reduce((sum, b) => sum + (b.totalRoyaltyEarned || 0), 0);
    const royaltyPaid = books.reduce((sum, b) => sum + (b.royaltyPaid || 0), 0);
    const royaltyPending = books.reduce((sum, b) => sum + (b.royaltyPending || 0), 0);

    const activeTickets = await Ticket.countDocuments({
      $or: [{ authorEmail: req.user.email }, { authorId: req.user.authorId }],
      status: { $in: ['Open', 'In Progress'] }
    });

    const resolvedTickets = await Ticket.countDocuments({
      $or: [{ authorEmail: req.user.email }, { authorId: req.user.authorId }],
      status: { $in: ['Resolved', 'Closed'] }
    });

    return res.json({
      success: true,
      stats: {
        totalBooks,
        publishedBooks,
        totalCopiesSold,
        totalRoyaltyEarned,
        royaltyPaid,
        royaltyPending,
        activeTickets,
        resolvedTickets
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve author summary.'
    });
  }
});

module.exports = router;
