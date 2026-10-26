import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Upload, Paperclip, X, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AuthorNewTicket({ preSelectedBook, onTicketCreated }) {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(preSelectedBook?.bookId || 'GENERAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await api.getMyBooks();
        if (res.success) setBooks(res.books || []);
      } catch (err) {
        console.error('Failed to load books for dropdown', err);
      }
    }
    loadBooks();
  }, []);

  useEffect(() => {
    if (preSelectedBook) {
      setSelectedBookId(preSelectedBook.bookId);
    }
  }, [preSelectedBook]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((f) => ({
      filename: f.name,
      size: f.size,
      mimeType: f.type,
      url: URL.createObjectURL(f)
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (tmplSubject, tmplDesc) => {
    setSubject(tmplSubject);
    setDescription(tmplDesc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject and a description for your query.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await api.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        bookId: selectedBookId,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          size: a.size,
          mimeType: a.mimeType
        }))
      });

      if (res.success) {
        setSubmittedTicket(res.ticket);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit support query.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setAttachments([]);
    setSubmittedTicket(null);
    setError('');
  };

  if (submittedTicket) {
    return (
      <div className="fade-in" style={{ maxWidth: '650px', margin: '40px auto' }}>
        <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Query Submitted Successfully!
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
            Your ticket <strong>{submittedTicket.ticketNumber}</strong> has been assigned to our author support queue.
            Our operations team will review your query and reply promptly.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => onTicketCreated(submittedTicket)}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              <span>View Ticket Conversation</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={resetForm}
              className="btn btn-secondary"
              style={{ padding: '10px 20px' }}
            >
              Submit Another Query
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: '800', color: '#0f172a' }}>
            Submit a Support Query
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
            Reach out to BookLeaf author operations regarding royalty payouts, ISBN catalog listings, print copies, or book progress.
          </p>
        </div>

        <div style={{ marginBottom: '20px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Quick Query Templates:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() =>
                applyTemplate(
                  'Overdue quarterly royalty payment for my book',
                  'I published my book over 4 months ago and have not received my quarterly royalty payout yet. Could you please check why the payout has not arrived in my account?'
                )
              }
            >
              Royalty Payout Inquiry
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() =>
                applyTemplate(
                  'ISBN mismatch between physical copy and Amazon listing',
                  'When searching for my book on Amazon, the product details page lists a different ISBN than the one printed on my physical proof copy.'
                )
              }
            >
              ISBN Mismatch Issue
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() =>
                applyTemplate(
                  'Print quality defect on author copies received',
                  'I received my shipment of author copies, but the cover colors appear faded and pages are misaligned. Please help arrange a reprint.'
                )
              }
            >
              Print Quality Defect
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() =>
                applyTemplate(
                  'Book is showing Currently Unavailable on Amazon',
                  'My published book is showing as Currently Unavailable on Amazon India. Could you please look into this and trigger an inventory re-sync?'
                )
              }
            >
              Amazon Stock Sync
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.875rem',
              marginBottom: '20px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Related Book <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              className="form-select"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
            >
              <option value="GENERAL">General / Account Level (Not Book Specific)</option>
              {books.map((b) => (
                <option key={b.bookId} value={b.bookId}>
                  {b.title} (ISBN: {b.isbn} • {b.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Subject Line <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Overdue quarterly royalty payout inquiry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Detailed Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              required
              rows={6}
              className="form-textarea"
              placeholder="Please describe your query in detail including dates, copy quantities, platform names, or bank details if relevant..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Attachments (Optional)
            </label>
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('ticket-file-input').click()}
            >
              <input
                id="ticket-file-input"
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={20} color="#64748b" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#0f172a' }}>
                Click to attach files or screenshots
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG, PDF up to 10MB</div>
            </div>

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {attachments.map((att, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#334155'
                    }}
                  >
                    <Paperclip size={12} />
                    <span>{att.filename}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '0.9375rem' }}
            >
              {submitting ? 'Submitting Query...' : 'Submit Support Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
