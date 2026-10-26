import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { X, Send, User, Shield, Paperclip } from 'lucide-react';

export default function TicketThreadModal({ ticketId, onClose }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadTicket() {
      try {
        const res = await api.getTicket(ticketId);
        if (res.success) {
          setTicket(res.ticket);
        }
      } catch (err) {
        setError('Failed to load conversation thread.');
      } finally {
        setLoading(false);
      }
    }

    loadTicket();

    const socket = getSocket();
    socket.emit('join:ticket', ticketId);

    const handleNewMessage = (data) => {
      if (data.ticketId === ticketId) {
        setTicket((prev) => {
          if (!prev) return prev;
          const exists = prev.messages?.some(
            (m) => m._id && m._id === data.message._id
          );
          if (exists) return prev;
          return {
            ...prev,
            status: data.status || prev.status,
            messages: [...(prev.messages || []), data.message]
          };
        });
      }
    };

    const handleStatusUpdated = (data) => {
      if (data.ticketId === ticketId) {
        setTicket((prev) => (prev ? { ...prev, status: data.newStatus } : prev));
      }
    };

    socket.on('ticket:message', handleNewMessage);
    socket.on('ticket:status-updated', handleStatusUpdated);

    return () => {
      socket.emit('leave:ticket', ticketId);
      socket.off('ticket:message', handleNewMessage);
      socket.off('ticket:status-updated', handleStatusUpdated);
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.sendMessage(ticketId, {
        content: replyText.trim()
      });
      if (res.success) {
        setReplyText('');
      }
    } catch (err) {
      alert(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  if (!ticketId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: '800', color: '#0f5132', fontSize: '0.875rem' }}>
                {ticket?.ticketNumber || 'Ticket Thread'}
              </span>
              <span className="badge badge-category">{ticket?.category}</span>
              <span className={`badge badge-priority-${ticket?.priority?.toLowerCase()}`}>
                {ticket?.priority}
              </span>
              <span className={`badge badge-status-${ticket?.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                {ticket?.status}
              </span>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>
              {ticket?.subject}
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Associated Title: <strong>{ticket?.bookTitle}</strong>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>
              Loading message history...
            </div>
          ) : ticket?.messages?.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>
              No messages in this ticket yet.
            </div>
          ) : (
            ticket?.messages?.map((msg, index) => {
              const isAdmin = msg.senderRole === 'admin';
              const isSystem = msg.senderRole === 'system';

              if (isSystem) {
                return (
                  <div
                    key={index}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      background: '#f1f5f9',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      alignSelf: 'center'
                    }}
                  >
                    {msg.content}
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                    maxWidth: '85%'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: isAdmin ? '#0f5132' : '#334155',
                      marginBottom: '4px',
                      alignSelf: isAdmin ? 'flex-start' : 'flex-end'
                    }}
                  >
                    {isAdmin ? <Shield size={13} color="#0f5132" /> : <User size={13} />}
                    <span>{isAdmin ? 'BookLeaf Support Team' : 'You'}</span>
                    <span style={{ fontWeight: '400', color: '#94a3b8' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    style={{
                      background: isAdmin ? '#ffffff' : '#0f5132',
                      color: isAdmin ? '#0f172a' : '#ffffff',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      borderTopLeftRadius: isAdmin ? '4px' : '16px',
                      borderTopRightRadius: !isAdmin ? '4px' : '16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      border: isAdmin ? '1px solid #e2e8f0' : 'none',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontSize: '0.9375rem'
                    }}
                  >
                    {msg.content}

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {msg.attachments.map((att, aIdx) => (
                          <span
                            key={aIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: isAdmin ? '#f1f5f9' : 'rgba(255,255,255,0.2)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Paperclip size={12} /> {att.filename}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {ticket?.status === 'Closed' ? (
          <div style={{ padding: '16px', background: '#f1f5f9', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            This ticket has been marked as <strong>Closed</strong>. You can raise a new query if you have further questions.
          </div>
        ) : (
          <form
            onSubmit={handleSendReply}
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              placeholder="Type your reply here..."
              className="form-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="btn btn-primary"
              style={{ padding: '10px 18px', flexShrink: 0 }}
            >
              <Send size={16} />
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
