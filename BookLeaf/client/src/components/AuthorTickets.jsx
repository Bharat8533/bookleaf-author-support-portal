import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  ChevronRight,
  PlusCircle
} from 'lucide-react';

export default function AuthorTickets({ onSelectTicket, onNavigateToSubmit }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await api.getTickets();
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const socket = getSocket();

    const handleMessage = (data) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t._id === data.ticketId) {
            return {
              ...t,
              status: data.status || t.status,
              messages: [...(t.messages || []), data.message],
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        })
      );
    };

    const handleStatusUpdate = (data) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticketId ? { ...t, status: data.newStatus } : t))
      );
    };

    const handleNewTicket = (ticket) => {
      if (ticket.authorEmail === user?.email) {
        setTickets((prev) => [ticket, ...prev]);
      }
    };

    socket.on('ticket:message', handleMessage);
    socket.on('ticket:status-updated', handleStatusUpdate);
    socket.on('ticket:created', handleNewTicket);

    const pollInterval = setInterval(fetchTickets, 8000);

    return () => {
      socket.off('ticket:message', handleMessage);
      socket.off('ticket:status-updated', handleStatusUpdate);
      socket.off('ticket:created', handleNewTicket);
      clearInterval(pollInterval);
    };
  }, [user]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading your support tickets...
      </div>
    );
  }

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
            My Support Tickets
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Track your questions and view replies from BookLeaf Publishing operations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            {['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
              <button
                key={st}
                className="btn btn-sm"
                style={{
                  background: statusFilter === st ? '#ffffff' : 'transparent',
                  color: statusFilter === st ? '#0f5132' : '#64748b',
                  boxShadow: statusFilter === st ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontWeight: statusFilter === st ? '700' : '600'
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={onNavigateToSubmit}
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 14px' }}
          >
            <PlusCircle size={15} />
            <span>New Query</span>
          </button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
          No support tickets found matching the selected status.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTickets.map((ticket) => {
            const adminReplies = (ticket.messages || []).filter((m) => m.senderRole === 'admin');
            const latestAdminReply = adminReplies.length > 0 ? adminReplies[adminReplies.length - 1] : null;

            return (
              <div
                key={ticket._id}
                className="card"
                onClick={() => onSelectTicket(ticket)}
                style={{
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.8125rem', color: '#0f5132' }}>
                      {ticket.ticketNumber}
                    </span>
                    <span className="badge badge-category">{ticket.category}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      • Book: <strong>{ticket.bookTitle}</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                    {ticket.subject}
                  </h3>

                  <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '8px', maxWidth: '700px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <strong>Original Query:</strong> {ticket.description}
                  </p>

                  {latestAdminReply ? (
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: '#0f5132',
                        background: '#f0fdf4',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #dcfce7',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        maxWidth: '750px'
                      }}
                    >
                      <CheckCircle2 size={14} color="#15803d" />
                      <span style={{ fontWeight: '700' }}>BookLeaf Team:</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '500px' }}>
                        {latestAdminReply.content.substring(0, 100)}...
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Awaiting response from author operations team
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <span className={`badge badge-status-${ticket.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {ticket.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#0f5132', fontWeight: '600' }}>
                    <span>View Thread</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
