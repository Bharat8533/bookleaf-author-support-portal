require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Book = require('./models/Book');
const Ticket = require('./models/Ticket');
const { processTicketAI } = require('./services/aiService');

const sampleDataPath = path.resolve(__dirname, '../../bookleaf_sample_data.json');
const sampleData = require(sampleDataPath);

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leafdesk';
    await mongoose.connect(mongoUri);

    const adminEmail = 'admin@bookleafpub.com';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = new User({
        name: 'BookLeaf Admin Operations',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        phone: '+91-11-45678900',
        city: 'Delhi',
        joinedDate: '2022-01-01'
      });
      await adminUser.save();
    }

    let authorsCount = 0;
    let booksCount = 0;
    const authorDocs = [];
    const bookDocs = [];

    for (const authorData of sampleData.authors) {
      const email = authorData.email.toLowerCase().trim();
      let author = await User.findOne({ email });

      if (!author) {
        author = new User({
          authorId: authorData.author_id,
          name: authorData.name,
          email,
          password: 'author123',
          role: 'author',
          phone: authorData.phone,
          city: authorData.city,
          joinedDate: authorData.joined_date
        });
        await author.save();
      } else {
        author.name = authorData.name;
        author.authorId = authorData.author_id;
        author.phone = authorData.phone;
        author.city = authorData.city;
        author.joinedDate = authorData.joined_date;
        await author.save();
      }
      authorDocs.push(author);
      authorsCount++;

      if (authorData.books && authorData.books.length > 0) {
        for (const b of authorData.books) {
          let book = await Book.findOne({ bookId: b.book_id });
          const bookPayload = {
            bookId: b.book_id,
            authorId: authorData.author_id,
            authorEmail: email,
            authorName: authorData.name,
            title: b.title,
            isbn: b.isbn,
            genre: b.genre,
            publicationDate: b.publication_date,
            status: b.status,
            mrp: b.mrp,
            authorRoyaltyPerCopy: b.author_royalty_per_copy,
            totalCopiesSold: b.total_copies_sold,
            totalRoyaltyEarned: b.total_royalty_earned,
            royaltyPaid: b.royalty_paid,
            royaltyPending: b.royalty_pending,
            lastRoyaltyPayoutDate: b.last_royalty_payout_date,
            printPartner: b.print_partner,
            availableOn: b.available_on
          };

          if (!book) {
            book = new Book(bookPayload);
            await book.save();
          } else {
            Object.assign(book, bookPayload);
            await book.save();
          }
          bookDocs.push(book);
          booksCount++;
        }
      }
    }

    const sampleQueries = [
      {
        ticketNumber: 'TICK-1001',
        authorEmail: 'priya.sharma@email.com',
        bookId: 'BK001',
        subject: 'I published my book 4 months ago and still haven’t received any royalty. What’s going on?',
        description:
          'Hello BookLeaf team, I published "Whispers of the Ganges" 4 months ago and have not received any royalty payout yet. Can you please check why the payout has not arrived in my account?',
        status: 'Open',
        daysAgo: 1
      },
      {
        ticketNumber: 'TICK-1002',
        authorEmail: 'rohit.kapoor@email.com',
        bookId: 'BK004',
        subject: 'My royalty amount seems too low. I sold 200 copies but only received ₹3,000.',
        description:
          'My dashboard shows healthy sales for "Startup Sutra", but the amount transferred was only ₹3,000 for 200 copies. Could you clarify how the deductions are calculated?',
        status: 'In Progress',
        daysAgo: 2
      },
      {
        ticketNumber: 'TICK-1003',
        authorEmail: 'ananya.reddy@email.com',
        bookId: 'BK005',
        subject: 'My book is showing a different ISBN on Amazon than what’s on the physical copy.',
        description:
          'Urgent issue: When I search for my book "Echoes of Silence" on Amazon, the product details page lists a completely different ISBN than the one printed on my physical proof copy.',
        status: 'Open',
        daysAgo: 0
      },
      {
        ticketNumber: 'TICK-1004',
        authorEmail: 'vikram.joshi@email.com',
        bookId: 'BK006',
        subject: 'I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.',
        description:
          'The shipment of 10 author copies for "The Last Monsoon" arrived today. The cover color looks washed out and 3 pages in chapter 2 are visibly skewed. Please help arrange a reprint.',
        status: 'In Progress',
        daysAgo: 3
      },
      {
        ticketNumber: 'TICK-1005',
        authorEmail: 'sneha.kulkarni@email.com',
        bookId: 'BK009',
        subject: 'My book is published but it’s showing as "Currently Unavailable" on Amazon.',
        description:
          'My readers are telling me they cannot purchase "Flavors of the Ghats" on Amazon because it says Currently Unavailable. Please look into this as soon as possible.',
        status: 'Open',
        daysAgo: 1
      },
      {
        ticketNumber: 'TICK-1006',
        authorEmail: 'meera.nair@email.com',
        bookId: 'BK008',
        subject: 'It’s been 3 weeks and my book is still in typesetting. When will it be done?',
        description:
          'Hi team, "Beyond the Malabar Coast" has been in the Typesetting status for over three weeks now. Could you please give me an updated delivery schedule for the interior proof?',
        status: 'Open',
        daysAgo: 4
      },
      {
        ticketNumber: 'TICK-1007',
        authorEmail: 'arjun.malhotra@email.com',
        bookId: 'BK010',
        subject: 'Can I update the description of my book on Amazon after it’s already live?',
        description:
          'I would like to refine the book blurb and add an endorsement quote to the description on Amazon for "Mind Over Money". What is the process for submitting this update?',
        status: 'Resolved',
        daysAgo: 5
      }
    ];

    let ticketsCreated = 0;
    for (const sq of sampleQueries) {
      const existingTicket = await Ticket.findOne({ ticketNumber: sq.ticketNumber });
      if (existingTicket) {
        continue;
      }

      const author = authorDocs.find((a) => a.email === sq.authorEmail);
      const book = bookDocs.find((b) => b.bookId === sq.bookId);

      const ai = await processTicketAI({
        subject: sq.subject,
        description: sq.description,
        authorName: author ? author.name : 'Author',
        authorEmail: sq.authorEmail,
        book
      });

      const createdAtDate = new Date(Date.now() - sq.daysAgo * 24 * 60 * 60 * 1000);

      const ticketMessages = [
        {
          senderRole: 'author',
          senderName: author ? author.name : 'Author',
          senderEmail: sq.authorEmail,
          content: sq.description,
          timestamp: createdAtDate
        }
      ];

      if (sq.status === 'In Progress' || sq.status === 'Resolved') {
        ticketMessages.push({
          senderRole: 'admin',
          senderName: 'BookLeaf Admin Operations',
          senderEmail: 'admin@bookleafpub.com',
          content: ai.draftResponse,
          timestamp: new Date(createdAtDate.getTime() + 2 * 60 * 60 * 1000)
        });
      }

      const ticket = new Ticket({
        ticketNumber: sq.ticketNumber,
        authorId: author ? author.authorId : 'AUTH000',
        authorName: author ? author.name : 'Author',
        authorEmail: sq.authorEmail,
        bookId: sq.bookId,
        bookTitle: book ? book.title : 'General / Account Level',
        subject: sq.subject,
        description: sq.description,
        status: sq.status,
        category: ai.category,
        aiCategory: ai.category,
        categoryOverridden: false,
        priority: ai.priority,
        aiPriority: ai.priority,
        priorityReason: ai.priorityReason,
        priorityOverridden: false,
        classificationSource: ai.classificationSource || 'fallback',
        aiDraftResponse: ai.draftResponse,
        aiModelUsed: ai.modelUsed,
        internalNotes: [
          {
            note: `Classified as ${ai.category} with ${ai.priority} priority.`,
            createdByName: 'System AI Engine',
            createdByEmail: 'ai@bookleafpub.com',
            createdAt: createdAtDate
          }
        ],
        messages: ticketMessages,
        createdAt: createdAtDate,
        updatedAt: new Date(createdAtDate.getTime() + 3 * 60 * 60 * 1000)
      });

      await ticket.save();
      ticketsCreated++;
    }

    console.log(`Seeding complete. ${ticketsCreated} tickets created.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  }
}

seedDatabase();
