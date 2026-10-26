# BookLeaf Author Support & Communication Portal (LeafDesk)

An author support and communication operations platform tailored for **BookLeaf Publishing**. Built with the **MERN** stack (MongoDB, Express, React, Node.js) with real-time **Socket.io** event streaming, AI-powered query classification, policy-grounded draft response generation, and role-based access control.

---

## 🔑 Test Login Credentials

All accounts are seeded into the database with the standard test password: `author123` (authors) and `admin123` (admin operations).

| Role | Name | Email | Password | Scope & Test Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Operations** | Operations Team | `admin@bookleafpub.com` | `admin123` | Full queue access, AI classification, priority scoring, editable AI response drafts, assignment, internal notes. |
| **Author (Top Earner)** | Priya Sharma | `priya.sharma@email.com` | `author123` | 2 published books (*Whispers of the Ganges*, *The Saffron Diaries*), ₹3,570 pending royalty. |
| **Author (Bestseller)** | Rohit Kapoor | `rohit.kapoor@email.com` | `author123` | 2 books (*Code & Karma*, *Startup Sutra*), 2,079 copies sold, ₹7,744 pending royalty. |
| **Author (Metadata Issue)** | Ananya Reddy | `ananya.reddy@email.com` | `author123` | 1 book (*Echoes of Silence*), ISBN mismatch test case. |
| **Author (Print Defect)** | Vikram Joshi | `vikram.joshi@email.com` | `author123` | 2 books (*The Last Monsoon*, *Beyond the Ghats*), print quality defect test case. |
| **Author (Stock Sync)** | Sneha Kulkarni | `sneha.kulkarni@email.com` | `author123` | 3 books, Amazon availability sync test case. |

---

## 🚀 Project Setup Instructions

### 1. Prerequisites
- **Node.js**: v18 or higher (Node.js v20+ recommended)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/leafdesk`) or a MongoDB Atlas connection string

### 2. Environment Variables Configuration
In `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/leafdesk
JWT_SECRET=bookleaf_leafdesk_jwt_secret_token_secure_2026
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=
GEMINI_API_KEY=
```

#### MongoDB Atlas Configuration:
To use MongoDB Atlas instead of local MongoDB:
1. Create a cluster on MongoDB Atlas.
2. In Database Access, create a database user and password.
3. In Network Access, allow your IP address (or `0.0.0.0/0` for development).
4. Copy the connection string (e.g. `mongodb+srv://<username>:<password>@cluster0.mongodb.net/leafdesk?retryWrites=true&w=majority`).
5. Set `MONGODB_URI=<your_atlas_connection_string>` in `server/.env`.

### 3. Backend Setup & Seeding
```bash
cd server
npm install

# Seed the 10 authors, 18 books and 7 sample queries (Idempotent: safe to run multiple times)
npm run seed

# Start the server (runs on http://localhost:5000)
npm run dev
```

### 4. Frontend Setup
```bash
cd ../client
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

---

## 📋 Features & Screen Walkthrough

### 1. Admin Portal
- **Conventional Sidebar**: Clean navigation with **Dashboard**, **Tickets**, **My Assigned Tickets**, and **Logout**.
- **Admin Dashboard**:
  - 4 real-time database metrics: Total Tickets, Open Tickets, In-Progress Tickets, Critical/High-Priority Unresolved Tickets.
  - Recent & Urgent Unresolved Tickets table with direct link to open and resolve.
- **Ticket List (`/tickets`)**:
  - Practical table with columns: **Ticket ID**, **Subject**, **Author**, **Category**, **Priority**, **Status**, **Assigned Admin**, **Creation Date**, and **Action**.
  - Functional search across ticket #, subject, author, email, and book title.
  - Filter by Status (*Open*, *In Progress*, *Resolved*, *Closed*), Category (6 categories), Priority (Critical, High, Medium, Low).
  - Sorting: **Urgency First** (Critical/High on top), **SLA Aging** (oldest unresolved first), and **Most Recent**.
  - Visual row highlighting for urgent tickets and SLA overdue tickets (>48 hours).
  - Pagination controls.
- **My Assigned Tickets**:
  - Instant filtered view of tickets assigned to the logged-in admin.
- **Ticket Details Workspace**:
  - Single integrated screen for ticket resolution.
  - Ticket metadata: Subject, original query, author details, linked book details (ISBN, MRP, sales, pending royalty).
  - Public conversation thread.
  - Quick actions: Change status, override category, override priority, assign to self.
  - **Editable AI Response Draft**: Prepopulated with AI draft response; includes "Generate AI Draft", "Regenerate Draft", and "Send Reply to Author".
  - **Private Internal Notes**: Administrator-only private notes section; strictly omitted from all author endpoints.

### 2. Author Portal
- **Sidebar**: **Dashboard**, **My Books**, **My Tickets**, **Submit a Query**, and **Logout**.
- **Author Dashboard**:
  - 6 real-time author metrics: Total Books, Published Books, Copies Sold, Total Royalty Earned, Royalty Paid, and Royalty Pending.
  - Recent books and recent support queries with instant access.
- **My Books**:
  - Table containing: **Title**, **ISBN**, **Genre**, **Publication Date**, **Publication Status**, **MRP**, **Copies Sold**, **Total Royalty Earned**, **Royalty Paid**, **Royalty Pending**, and **Action**.
  - Functional search and Publication Status filter dropdown.
  - "Query" action button to ask a question directly linked to a specific book.
- **My Tickets**:
  - List of author's support tickets with subject, related book, status badge, original query preview, latest team reply snippet, and date.
  - Real-time updates via Socket.IO with periodic polling fallback so author sees team responses without manual page refreshes.
  - Click to view conversation modal and send follow-up replies.
- **Submit a Query**:
  - Form fields: Related Book selection (including "General / Account Level"), Subject, Detailed description, optional file attachment UI.
  - Pre-built quick query templates (Royalty Inquiry, ISBN Glitch, Print Defect, Amazon Stock Sync).
  - Client and server-side validation with clear success feedback.

---

## 🧠 AI Classification & Response Drafting Approach

AI integration is implemented as a dedicated, maintainable backend service (`server/src/services/aiService.js`) with small, modular functions.

### A. Ticket Classification
When a ticket is created:
1. The ticket is saved in MongoDB first to guarantee zero data loss.
2. The subject, description, and book context are sent to the AI service.
3. The AI model returns a category, priority, and short rationale using structured JSON output.
4. The backend validates the output strictly against predefined enums:
   - **Categories**: `Royalty & Payments`, `ISBN & Metadata Issues`, `Printing & Quality`, `Distribution & Availability`, `Book Status & Production Updates`, `General Inquiry`
   - **Priorities**: `Critical`, `High`, `Medium`, `Low`
5. The validated classification and source (`ai` vs `fallback`) are saved to the ticket.
6. Admins can override category or priority at any time with audit tracking.

### B. Response Draft Generation
When an admin opens a ticket or clicks "Generate AI Draft":
1. Targeted slices of BookLeaf's knowledge base policies (royalty 80/20 split, 45-day cycle, ₹1,000 threshold, 5–7 day print turnaround, 24–48h Amazon re-sync) are injected into the prompt along with the author's verified book figures.
2. The prompt directs the model to sound empathetic, own issues directly, provide clear 48-hour resolution commitments, and **never invent fictitious payment dates or completed transfers**.
3. The generated draft appears in a normal editable textarea for the admin to review, edit, or adjust before sending.

### C. Cost Management & Token Optimization
- **Targeted Semantic Slicing**: Instead of sending the entire knowledge base and ticket history on every call, the backend extracts only the relevant policy slice matching the query.
- **Model Choice**: Lightweight, fast models (`gemini-1.5-flash` or `gpt-4o-mini`) configured with low temperatures (0.2–0.3) for consistent, cost-effective inference.

### D. Graceful Failure & Offline Reliability
- AI is never a blocker for ticket creation. If the API key is missing, network times out, or the LLM returns invalid JSON, the system smoothly falls back to an internal rule engine calibrated on BookLeaf's policies.
- The ticket remains saved, and the admin interface clearly indicates whether the draft/classification came from AI or the fallback rule engine.
- Admins can always compose and send manual responses.

---

## 🔒 Authorization & Security

1. **Password Hashing**: Passwords are encrypted using `bcryptjs` with salt rounds.
2. **JWT Route Protection**: All protected endpoints require a valid Bearer token validated via `protect` middleware.
3. **Role-Based Access Control**: Sensitive actions (status changes, category overrides, internal notes, ticket assignments, queue statistics) are protected by `requireRole('admin')`.
4. **Data Isolation (Tenant Separation)**: Authors can only fetch and query their own books and tickets. MongoDB queries strictly filter by `authorEmail` or `authorId`.
5. **Information Leakage Prevention**: Author endpoints explicitly strip `internalNotes` and `aiDraftResponse` so internal operational communication is never exposed to authors.

---

## 📡 Key API Endpoints

Interactive Swagger documentation is available at `http://localhost:5000/api/docs`.

### Authentication
- `POST /api/auth/login` — Authenticate author or admin and receive JWT token
- `GET /api/auth/me` — Get authenticated user profile
- `GET /api/auth/demo-users` — Retrieve seeded accounts list

### Books
- `GET /api/books/my-books?search=...&status=...` — Retrieve author catalog with financial summary
- `GET /api/books` — Retrieve catalog titles (admin only)
- `GET /api/books/:id` — Retrieve single book details

### Tickets
- `GET /api/tickets?status=...&category=...&priority=...&search=...&sortBy=...&assignedTo=...&page=...&limit=...` — Filtered ticket list
- `GET /api/tickets/:id` — Get single ticket thread
- `POST /api/tickets` — Create new ticket (triggers classification)
- `POST /api/tickets/:id/messages` — Send response message
- `PATCH /api/tickets/:id/status` — Update ticket status (admin only)
- `PATCH /api/tickets/:id/classification` — Override category/priority (admin only)
- `POST /api/tickets/:id/notes` — Add private internal note (admin only)
- `PATCH /api/tickets/:id/assign` — Assign ticket to admin or self (admin only)
- `POST /api/tickets/:id/generate-draft` / `regenerate-draft` — Generate AI response draft (admin only)

### Statistics
- `GET /api/stats/admin` — Dashboard operational metrics (total, open, in-progress, critical, SLA overdue)
- `GET /api/stats/author` — Author metrics (total books, published books, copies sold, royalties earned/paid/pending)

---

## ⚠️ Known Limitations

1. **File Upload Storage**: File attachments in the query submission form simulate uploaded files with size and MIME type metadata for demonstrations. A production deployment would link this to an Amazon S3 or Google Cloud Storage bucket.
2. **Email Notifications**: Outbound transactional emails (e.g. SMTP/SendGrid notifications to author's external inbox) are not configured; ticket responses are delivered through the in-app portal thread with real-time updates.
