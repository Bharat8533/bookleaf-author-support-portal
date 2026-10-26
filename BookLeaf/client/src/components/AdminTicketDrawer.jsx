import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Send,
  Sparkles,
  RefreshCw,
  Lock,
  Edit3,
  UserCheck,
  Check
} from 'lucide-react';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

export default function AdminTicketDrawer({ ticketId, onClose, onTicketUpdated }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const [responseContent, setResponseContent] = useState('');
  const [statusToSet, setStatusToSet] = useState('In Progress');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftSourceInfo, setDraftSourceInfo] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [savingClassification, setSavingClassification] = useState(false);
  const [classificationSuccess, setClassificationSuccess] = useState(false);

  const [internalNoteText, setInternalNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const messagesEndRef = useRef(null);

  const loadTicketData = async () => {
    try {
      const res = await api.getTicket(ticketId);
      if (res.success) {
        const t = res.ticket;
        setTicket(t);
        setSelectedCategory(t.category);
        setSelectedPriority(t.priority);
        setStatusToSet(t.status === 'Resolved' || t.status === 'Closed' ? t.status : 'Resolved');

        if (t.aiDraftResponse) {
          setResponseContent(t.aiDraftResponse);
          setDraftSourceInfo(t.aiModelUsed || 'AI Engine');
        }

        if (t.bookId && t.bookId !== 'GENERAL') {
          const bookRes = await api.getAllBooks({ search: t.bookId });
          if (bookRes.success && bookRes.books.length > 0) {
            setBook(bookRes.books[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();

    const socket = getSocket();
    socket.emit('join:ticket', ticketId);

    const handleMessage = (data) => {
      if (data.ticketId === ticketId) {
        setTicket((prev) => {
          if (!prev) return prev;
          const exists = prev.messages?.some((m) => m._id && m._id === data.message._id);
          if (exists) return prev;
          return {
            ...prev,
            status: data.status || prev.status,
            messages: [...(prev.messages || []), data.message]
          };
        });
      }
    };

    const handleStatus = (data) => {
      if (data.ticketId === ticketId) {
        setTicket((prev) => (prev ? { ...prev, status: data.newStatus } : prev));
      }
    };

    socket.on('ticket:message', handleMessage);
    socket.on('ticket:status-updated', handleStatus);

    return () => {
      socket.emit('leave:ticket', ticketId);
      socket.off('ticket:message', handleMessage);
      socket.off('ticket:status-updated', handleStatus);
    };
  }, [ticketId]);

  const handleGenerateOrRegenerateDraft = async () => {
    setGeneratingDraft(true);
    try {
      const res = await api.regenerateDraft(ticketId);
      if (res.success) {
        setResponseContent(res.aiDraftResponse);
        setDraftSourceInfo(res.aiModelUsed);
        setTicket((prev) => ({
          ...prev,
          aiDraftResponse: res.aiDraftResponse,
          aiModelUsed: res.aiModelUsed
        }));
      }
    } catch (err) {
      alert('Failed to generate draft. You can still compose a manual response.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSaveClassification = async () => {
    setSavingClassification(true);
    try {
      const res = await api.overrideClassification(ticketId, {
        category: selectedCategory,
        priority: selectedPriority
      });
      if (res.success) {
        setTicket(res.ticket);
        setClassificationSuccess(true);
        setTimeout(() => setClassificationSuccess(false), 2500);
        if (onTicketUpdated) onTicketUpdated(res.ticket);
      }
    } catch (err) {
      alert(err.message || 'Failed to update classification');
    } finally {
      setSavingClassification(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      const res = await api.assignTicket(ticketId, {
        adminId: user._id,
        name: user.name,
        email: user.email
      });
      if (res.success) {
        setTicket(res.ticket);
        if (onTicketUpdated) onTicketUpdated(res.ticket);
      }
    } catch (err) {
      alert('Failed to assign ticket');
    }
  };

  const handleSendResponse = async () => {
    if (!responseContent.trim()) {
      alert('Response content cannot be empty.');
      return;
    }

    setSendingResponse(true);
    try {
      const res = await api.sendMessage(ticketId, {
        content: responseContent.trim(),
        statusChange: statusToSet
      });
      if (res.success) {
        setTicket(res.ticket);
        setResponseContent('');
        if (onTicketUpdated) onTicketUpdated(res.ticket);
      }
    } catch (err) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;

    setAddingNote(true);
    try {
      const res = await api.addInternalNote(ticketId, internalNoteText.trim());
      if (res.success) {
        setTicket((prev) => ({ ...prev, internalNotes: res.internalNotes }));
        setInternalNoteText('');
      }
    } catch (err) {
      alert('Failed to add internal note');
    } finally {
      setAddingNote(false);
    }
  };

  if (!ticketId) return null;
  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  const isAssignedToCurrentAdmin = ticket?.assignedTo?.adminId === user?._id?.toString();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          height: '100vh',
          background: '#ffffff',
          boxShadow: '-8px 0 25px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f5132' }}>
              {ticket?.ticketNumber}
            </span>
            <span className={`badge badge-priority-${ticket?.priority?.toLowerCase()}`}>
              {ticket?.priority}
            </span>
            <span className={`badge badge-status-${ticket?.status?.toLowerCase().replace(/\s+/g, '-')}`}>
              {ticket?.status}
            </span>
            <span className="badge badge-category">{ticket?.category}</span>

            <span style={{ fontSize: '0.8125rem', color: '#64748b', marginLeft: '6px' }}>
              Assignee:{' '}
              <strong style={{ color: '#0f172a' }}>{ticket?.assignedTo?.name || 'Unassigned'}</strong>
            </span>
            {!isAssignedToCurrentAdmin && (
              <button
                onClick={handleAssignToMe}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              >
                <UserCheck size={13} /> Assign to me
              </button>
            )}
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }} title="Close">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ margin: 'auto', color: '#64748b' }}>Loading ticket details...</div>
        ) : (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.15fr', overflow: 'hidden' }}>
            <div
              style={{
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto',
                background: '#f8fafc'
              }}
            >
              <div style={{ padding: '20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                  {ticket?.subject}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', color: '#64748b' }}>
                  <div>
                    Author: <strong style={{ color: '#0f172a' }}>{ticket?.authorName}</strong> ({ticket?.authorEmail})
                  </div>
                  <div>
                    Related Book: <strong style={{ color: '#0f172a' }}>{ticket?.bookTitle}</strong>
                  </div>
                  <div>
                    Submitted:{' '}
                    <strong>{new Date(ticket?.createdAt).toLocaleString()}</strong>
                  </div>
                </div>

                {book && (
                  <div
                    style={{
                      marginTop: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '0.8125rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px'
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b' }}>ISBN: </span>
                      <span>{book.isbn}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Status: </span>
                      <strong style={{ color: '#0f5132' }}>{book.status}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Copies Sold: </span>
                      <span>{book.totalCopiesSold}</span>
                    </div>
                    <div>
                      <span style={{ color: '#b45309' }}>Pending Royalty: </span>
                      <strong style={{ color: '#b45309' }}>{formatINR(book.royaltyPending)}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Conversation Thread
                </div>

                {ticket?.messages?.map((msg, idx) => {
                  const isAdmin = msg.senderRole === 'admin';
                  const isSystem = msg.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div
                        key={idx}
                        style={{
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          color: '#64748b',
                          background: '#e2e8f0',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          alignSelf: 'center'
                        }}
                      >
                        {msg.content}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '90%'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: isAdmin ? '#0f5132' : '#334155',
                          marginBottom: '3px',
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {isAdmin ? 'Admin Reply' : ticket?.authorName} •{' '}
                        <span style={{ fontWeight: '400', color: '#94a3b8' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        style={{
                          background: isAdmin ? '#0f5132' : '#ffffff',
                          color: isAdmin ? '#ffffff' : '#0f172a',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: isAdmin ? 'none' : '1px solid #e2e8f0',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fffbeb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
                  <Lock size={14} />
                  <span>Private Internal Notes (Admin Eyes Only)</span>
                </div>

                {ticket?.internalNotes?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {ticket.internalNotes.map((n, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #fde68a',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          color: '#78350f'
                        }}
                      >
                        <div>{n.note}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#b45309', marginTop: '2px' }}>
                          By {n.createdByName} • {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddInternalNote} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add private note (e.g. audited ledger, verified print status)..."
                    className="form-input"
                    style={{ fontSize: '0.8125rem', padding: '6px 10px', background: '#ffffff' }}
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={addingNote || !internalNoteText.trim()}
                    className="btn btn-secondary btn-sm"
                    style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#92400e' }}
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto',
                background: '#ffffff',
                padding: '24px',
                gap: '20px'
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>
                  Ticket Classification & Priority
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                      Category (AI: {ticket?.aiCategory})
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                      Priority (AI: {ticket?.aiPriority})
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {ticket?.priorityReason && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <strong>Rationale:</strong> {ticket.priorityReason}
                  </div>
                )}

                {(selectedCategory !== ticket?.category || selectedPriority !== ticket?.priority) && (
                  <button
                    onClick={handleSaveClassification}
                    disabled={savingClassification}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', borderColor: '#10b981', color: '#0f5132' }}
                  >
                    <Edit3 size={14} />
                    <span>{savingClassification ? 'Saving...' : 'Save Category / Priority Override'}</span>
                  </button>
                )}

                {classificationSuccess && (
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={13} /> Classification updated successfully.
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#10b981" />
                    <label style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>
                      AI Response Draft
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleGenerateOrRegenerateDraft}
                      disabled={generatingDraft}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <RefreshCw size={13} className={generatingDraft ? 'spin-slow' : ''} />
                      <span>{generatingDraft ? 'Drafting...' : ticket?.aiDraftResponse ? 'Regenerate Draft' : 'Generate AI Draft'}</span>
                    </button>
                  </div>
                </div>

                {draftSourceInfo && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Engine: <strong>{draftSourceInfo}</strong> • Review and edit below before sending to author.
                  </div>
                )}

                <textarea
                  rows={10}
                  className="form-textarea"
                  style={{
                    flex: 1,
                    minHeight: '220px',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    padding: '12px 14px'
                  }}
                  placeholder="The AI response draft will appear here directly for you to review and edit. You can also write a manual response..."
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: '600' }}>
                      Mark ticket as:
                    </span>
                    <select
                      className="form-select"
                      style={{ width: 'auto', fontSize: '0.8125rem', padding: '6px 10px' }}
                      value={statusToSet}
                      onChange={(e) => setStatusToSet(e.target.value)}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSendResponse}
                    disabled={sendingResponse || !responseContent.trim()}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', fontSize: '0.875rem' }}
                  >
                    <Send size={16} />
                    <span>{sendingResponse ? 'Sending...' : 'Send Reply to Author'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
