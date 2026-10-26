const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ['author', 'admin', 'system'],
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderEmail: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        mimeType: String
      }
    ],
    isAiDraft: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const internalNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true
    },
    createdByName: {
      type: String,
      required: true
    },
    createdByEmail: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
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
    authorName: {
      type: String,
      required: true
    },
    authorEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    bookId: {
      type: String,
      default: 'GENERAL',
      index: true
    },
    bookTitle: {
      type: String,
      default: 'General / Account Level'
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        mimeType: String
      }
    ],
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
      index: true
    },
    category: {
      type: String,
      enum: [
        'Royalty & Payments',
        'ISBN & Metadata Issues',
        'Printing & Quality',
        'Distribution & Availability',
        'Book Status & Production Updates',
        'General Inquiry'
      ],
      default: 'General Inquiry',
      index: true
    },
    aiCategory: {
      type: String,
      default: 'General Inquiry'
    },
    categoryOverridden: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true
    },
    aiPriority: {
      type: String,
      default: 'Medium'
    },
    priorityReason: {
      type: String,
      default: ''
    },
    priorityOverridden: {
      type: Boolean,
      default: false
    },
    classificationSource: {
      type: String,
      enum: ['ai', 'fallback', 'manual'],
      default: 'fallback'
    },
    aiDraftResponse: {
      type: String,
      default: ''
    },
    aiModelUsed: {
      type: String,
      default: 'BookLeaf AI Engine'
    },
    assignedTo: {
      adminId: { type: String, default: null, index: true },
      name: { type: String, default: null },
      email: { type: String, default: null }
    },
    internalNotes: [internalNoteSchema],
    messages: [ticketMessageSchema]
  },
  {
    timestamps: true
  }
);

ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
