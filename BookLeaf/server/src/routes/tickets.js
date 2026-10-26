const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Book = require('../models/Book');
const { protect, requireRole } = require('../middleware/auth');
const {
  classifyTicket,
  generateDraftResponse,
  processTicketAI,
  CATEGORIES,
  PRIORITIES
} = require('../services/aiService');

async function getNextTicketNumber() {
  const count = await Ticket.countDocuments();
  return `TICK-${1000 + count + 1}`;
}

router.get('/', protect, async (req, res) => {
  try {
    const { status, category, priority, search, sortBy, assignedTo, page, limit } = req.query;
    let query = {};

    if (req.user.role === 'author') {
      query.$or = [
        { authorEmail: req.user.email },
        { authorId: req.user.authorId }
      ];
    }

    if (status && status !== 'ALL') query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    if (assignedTo === 'me' && req.user.role === 'admin') {
      query['assignedTo.adminId'] = req.user._id.toString();
    } else if (assignedTo && assignedTo !== 'all') {
      query['assignedTo.adminId'] = assignedTo;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const searchConditions = [
        { ticketNumber: { $regex: s, $options: 'i' } },
        { subject: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { authorName: { $regex: s, $options: 'i' } },
        { authorEmail: { $regex: s, $options: 'i' } },
        { bookTitle: { $regex: s, $options: 'i' } }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    let sortOptions = { createdAt: -1 };

    if (sortBy === 'aging') {
      query.status = { $in: ['Open', 'In Progress'] };
      sortOptions = { createdAt: 1 };
    }

    const totalTickets = await Ticket.countDocuments(query);

    let queryBuilder = Ticket.find(query).sort(sortOptions);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isPaginated = !isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0;

    if (isPaginated && sortBy !== 'urgency') {
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    let tickets = await queryBuilder;

    if (sortBy === 'urgency') {
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      tickets.sort((a, b) => {
        const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (weightDiff !== 0) return weightDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      if (isPaginated) {
        tickets = tickets.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      }
    }

    if (req.user.role === 'author') {
      tickets = tickets.map((t) => {
        const doc = t.toObject();
        delete doc.internalNotes;
        delete doc.aiDraftResponse;
        return doc;
      });
    }

    return res.json({
      success: true,
      count: tickets.length,
      total: totalTickets,
      page: isPaginated ? pageNum : 1,
      totalPages: isPaginated ? Math.ceil(totalTickets / limitNum) : 1,
      tickets
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tickets.'
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    if (
      req.user.role === 'author' &&
      ticket.authorEmail !== req.user.email &&
      ticket.authorId !== req.user.authorId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have access to view this ticket.'
      });
    }

    const doc = ticket.toObject();
    if (req.user.role === 'author') {
      delete doc.internalNotes;
      delete doc.aiDraftResponse;
    }

    return res.json({
      success: true,
      ticket: doc
    });
  } catch (error) {
    console.error('Error fetching single ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket.'
    });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { subject, description, bookId, attachments } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject line is required.'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Detailed description is required.'
      });
    }

    let book = null;
    let bookTitle = 'General / Account Level';

    if (bookId && bookId !== 'GENERAL') {
      book = await Book.findOne({ bookId: bookId });
      if (book) {
        bookTitle = book.title;
      }
    }

    const ticketNumber = await getNextTicketNumber();

    const initialMessage = {
      senderRole: 'author',
      senderName: req.user.name,
      senderEmail: req.user.email,
      content: description.trim(),
      attachments: attachments || [],
      timestamp: new Date()
    };

    const ticket = new Ticket({
      ticketNumber,
      authorId: req.user.authorId || req.user._id.toString(),
      authorName: req.user.name,
      authorEmail: req.user.email,
      bookId: bookId || 'GENERAL',
      bookTitle,
      subject: subject.trim(),
      description: description.trim(),
      attachments: attachments || [],
      status: 'Open',
      category: 'General Inquiry',
      aiCategory: 'General Inquiry',
      categoryOverridden: false,
      priority: 'Medium',
      aiPriority: 'Medium',
      priorityReason: 'Initial submission pending AI classification',
      priorityOverridden: false,
      classificationSource: 'fallback',
      aiDraftResponse: '',
      aiModelUsed: 'Pending AI Analysis',
      messages: [initialMessage]
    });

    await ticket.save();

    try {
      const [classification, draft] = await Promise.all([
        classifyTicket({ subject: ticket.subject, description: ticket.description, book }),
        generateDraftResponse({
          subject: ticket.subject,
          description: ticket.description,
          category: 'General Inquiry',
          authorName: req.user.name,
          book
        })
      ]);

      ticket.category = classification.category;
      ticket.aiCategory = classification.category;
      ticket.priority = classification.priority;
      ticket.aiPriority = classification.priority;
      ticket.priorityReason = classification.rationale;
      ticket.classificationSource = classification.source;
      ticket.aiDraftResponse = draft.draftResponse;
      ticket.aiModelUsed = classification.modelUsed;

      await ticket.save();
    } catch (aiErr) {
      console.warn('AI pipeline error:', aiErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:created', ticket);
      io.to(`user_${req.user.email}`).emit('author:ticket:created', ticket);
    }

    const authorSafeTicket = ticket.toObject();
    delete authorSafeTicket.internalNotes;
    delete authorSafeTicket.aiDraftResponse;

    return res.status(201).json({
      success: true,
      message: 'Support ticket raised successfully.',
      ticket: authorSafeTicket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create support query. Please try again.'
    });
  }
});

router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { content, statusChange, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty.'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    if (
      req.user.role === 'author' &&
      ticket.authorEmail !== req.user.email &&
      ticket.authorId !== req.user.authorId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot reply to another author’s ticket.'
      });
    }

    const newMessage = {
      senderRole: req.user.role,
      senderName: req.user.name,
      senderEmail: req.user.email,
      content: content.trim(),
      attachments: attachments || [],
      timestamp: new Date()
    };

    ticket.messages.push(newMessage);

    if (req.user.role === 'admin') {
      if (statusChange && ['In Progress', 'Resolved', 'Closed'].includes(statusChange)) {
        ticket.status = statusChange;
      } else if (ticket.status === 'Open') {
        ticket.status = 'In Progress';
      }
    } else if (req.user.role === 'author' && ticket.status === 'Resolved') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:message', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: newMessage,
        status: ticket.status
      });
      io.to(`ticket_${ticket._id}`).emit('ticket:updated', ticket);
    }

    const responseTicket = ticket.toObject();
    if (req.user.role === 'author') {
      delete responseTicket.internalNotes;
      delete responseTicket.aiDraftResponse;
    }

    return res.json({
      success: true,
      message: 'Response sent successfully.',
      ticket: responseTicket
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message.'
    });
  }
});

router.patch('/:id/status', protect, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided.'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    ticket.messages.push({
      senderRole: 'system',
      senderName: 'System',
      senderEmail: 'system@bookleafpub.com',
      content: `Status updated from "${oldStatus}" to "${status}" by ${req.user.name}.`,
      timestamp: new Date()
    });

    await ticket.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:status-updated', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        oldStatus,
        newStatus: status
      });
    }

    return res.json({
      success: true,
      message: `Status updated to ${status}.`,
      ticket
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status.'
    });
  }
});

router.patch('/:id/classification', protect, requireRole('admin'), async (req, res) => {
  try {
    const { category, priority } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    if (category) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Category must be one of: ${CATEGORIES.join(', ')}`
        });
      }
      ticket.category = category;
      ticket.categoryOverridden = true;
    }

    if (priority) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Priority must be one of: ${PRIORITIES.join(', ')}`
        });
      }
      ticket.priority = priority;
      ticket.priorityOverridden = true;
    }

    ticket.classificationSource = 'manual';
    await ticket.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:classification-updated', {
        ticketId: ticket._id,
        category: ticket.category,
        priority: ticket.priority,
        categoryOverridden: ticket.categoryOverridden,
        priorityOverridden: ticket.priorityOverridden
      });
    }

    return res.json({
      success: true,
      message: 'Classification updated successfully.',
      ticket
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update classification.'
    });
  }
});

router.post('/:id/notes', protect, requireRole('admin'), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Internal note cannot be empty.'
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    const internalNote = {
      note: note.trim(),
      createdByName: req.user.name,
      createdByEmail: req.user.email,
      createdAt: new Date()
    };

    ticket.internalNotes.push(internalNote);
    await ticket.save();

    return res.status(201).json({
      success: true,
      message: 'Internal note added.',
      internalNotes: ticket.internalNotes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add internal note.'
    });
  }
});

router.patch('/:id/assign', protect, requireRole('admin'), async (req, res) => {
  try {
    const { adminId, name, email } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    ticket.assignedTo = {
      adminId: adminId || req.user._id.toString(),
      name: name || req.user.name,
      email: email || req.user.email
    };

    await ticket.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:assigned', {
        ticketId: ticket._id,
        assignedTo: ticket.assignedTo
      });
    }

    return res.json({
      success: true,
      message: `Assigned to ${ticket.assignedTo.name}.`,
      ticket
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to assign ticket.'
    });
  }
});

const handleGenerateDraft = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    let book = null;
    if (ticket.bookId && ticket.bookId !== 'GENERAL') {
      book = await Book.findOne({ bookId: ticket.bookId });
    }

    const draftResult = await generateDraftResponse({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      authorName: ticket.authorName,
      book,
      messages: ticket.messages
    });

    ticket.aiDraftResponse = draftResult.draftResponse;
    ticket.aiModelUsed = draftResult.modelUsed;
    await ticket.save();

    return res.json({
      success: true,
      message: 'AI response draft generated.',
      aiDraftResponse: ticket.aiDraftResponse,
      aiModelUsed: ticket.aiModelUsed,
      source: draftResult.source
    });
  } catch (error) {
    console.error('Draft generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI response draft.'
    });
  }
};

router.post('/:id/generate-draft', protect, requireRole('admin'), handleGenerateDraft);
router.post('/:id/regenerate-draft', protect, requireRole('admin'), handleGenerateDraft);

module.exports = router;
