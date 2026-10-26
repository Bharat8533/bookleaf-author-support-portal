const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    authorId: {
      type: String,
      required: true,
      index: true
    },
    authorEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    authorName: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true
    },
    isbn: {
      type: String,
      required: true,
      trim: true
    },
    genre: {
      type: String,
      default: 'General'
    },
    publicationDate: {
      type: String
    },
    status: {
      type: String,
      enum: [
        'Published & Live',
        'In Production - Cover Design',
        'In Production - Typesetting',
        'In Production - Editing',
        'In Production - Proofreading',
        'In Production - ISBN Assignment',
        'In Production - Printing',
        'In Production - Distribution Setup'
      ],
      default: 'Published & Live',
      index: true
    },
    mrp: {
      type: Number,
      default: 0
    },
    authorRoyaltyPerCopy: {
      type: Number,
      default: 0
    },
    totalCopiesSold: {
      type: Number,
      default: 0
    },
    totalRoyaltyEarned: {
      type: Number,
      default: 0
    },
    royaltyPaid: {
      type: Number,
      default: 0
    },
    royaltyPending: {
      type: Number,
      default: 0
    },
    lastRoyaltyPayoutDate: {
      type: String,
      default: null
    },
    printPartner: {
      type: String,
      default: 'In-House'
    },
    availableOn: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Book', bookSchema);
