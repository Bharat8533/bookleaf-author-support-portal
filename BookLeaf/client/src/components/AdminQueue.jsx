import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

export default function AdminQueue({ onOpenTicket, externalFilter, isAssignedOnly = false }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('urgency');
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (externalFilter) {
      if (externalFilter.status !== undefined) setStatus(externalFilter.status);
      if (externalFilter.priority !== undefined) setPriority(externalFilter.priority);
      if (externalFilter.sortBy !== undefined) setSortBy(externalFilter.sortBy);
      setPage(1);
    }
  }, [externalFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const filters = {
        status: status === 'ALL' ? '' : status,
        category,
        priority,
        sortBy,
        search,
        page,
        limit,
        assignedTo: isAssignedOnly ? 'me' : undefined
      };
      const res = await api.getTickets(filters);
      if (res.success) {
        setTickets(res.tickets || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || (res.tickets || []).length);
      }
    } catch (err) {
      console.error('Failed to load tickets queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [status, category, priority, sortBy, search, page, isAssignedOnly]);

  useEffect(() => {
    const socket = getSocket();

    const handleCreated = () => {
      loadTickets();
    };

    const handleStatus = (data) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticketId ? { ...t, status: data.newStatus } : t))
      );
    };

    const handleMessage = (data) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticketId ? { ...t, status: data.status || t.status } : t))
      );
    };

    const handleClassification = (data) => {
      setTickets((prev) =>
        prev.map((t) =>
          t._id === data.ticketId
            ? {
                ...t,
                category: data.category,
                priority: data.priority,
                categoryOverridden: data.categoryOverridden,
                priorityOverridden: data.priorityOverridden
              }
            : t
        )
      );
    };

    const handleAssigned = (data) => {
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticketId ? { ...t, assignedTo: data.assignedTo } : t))
      );
    };

    socket.on('ticket:created', handleCreated);
    socket.on('ticket:status-updated', handleStatus);
    socket.on('ticket:message', handleMessage);
    socket.on('ticket:classification-updated', handleClassification);
    socket.on('ticket:assigned', handleAssigned);

    return () => {
      socket.off('ticket:created', handleCreated);
      socket.off('ticket:status-updated', handleStatus);
      socket.off('ticket:message', handleMessage);
      socket.off('ticket:classification-updated', handleClassification);
      socket.off('ticket:assigned', handleAssigned);
    };
  }, [isAssignedOnly]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
          {isAssignedOnly ? 'My Assigned Tickets' : 'Support Tickets Queue'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {isAssignedOnly
            ? `Tickets currently assigned to ${user?.name}`
            : `Comprehensive queue of all author support tickets with AI classification & urgency sorting`}
        </p>
      </div>

      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            {['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
              <button
                key={st}
                className="btn btn-sm"
                style={{
                  background: status === st ? '#ffffff' : 'transparent',
                  color: status === st ? '#0f5132' : '#64748b',
                  boxShadow: status === st ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  fontWeight: status === st ? '700' : '600'
                }}
                onClick={() => {
                  setStatus(st);
                  setPage(1);
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={15} color="#64748b" />
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Sort:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="urgency">Urgency First (Critical on Top)</option>
              <option value="aging">Oldest Unresolved (SLA Aging)</option>
              <option value="recent">Most Recent First</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search ticket #, subject, author..."
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-select"
            style={{ fontSize: '0.875rem' }}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories ({CATEGORIES.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ fontSize: '0.875rem' }}
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
          No support tickets found matching the active criteria.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Author</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Admin</th>
                <th>Creation Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const isCritical = t.priority === 'Critical';
                const ageHours = Math.round((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60));
                const isOverdue = ageHours >= 48 && (t.status === 'Open' || t.status === 'In Progress');

                return (
                  <tr
                    key={t._id}
                    className={isCritical || isOverdue ? 'row-urgent' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onOpenTicket(t)}
                  >
                    <td style={{ fontWeight: '800', color: '#0f5132', whiteSpace: 'nowrap' }}>
                      {t.ticketNumber}
                    </td>

                    <td style={{ maxWidth: '320px' }}>
                      <div
                        style={{
                          fontWeight: '600',
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t.subject}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Book: <strong>{t.bookTitle}</strong>
                      </div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{t.authorName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.authorEmail}</div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-category">
                        {t.category}
                        {t.categoryOverridden && <span title="Admin Overridden" style={{ color: '#d97706' }}>*</span>}
                      </span>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                        {t.priorityOverridden && <span title="Admin Overridden">*</span>}
                      </span>
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge badge-status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {t.status}
                      </span>
                      {isOverdue && (
                        <div style={{ fontSize: '0.6875rem', color: '#be123c', fontWeight: '700', marginTop: '2px' }}>
                          SLA Aging ({Math.round(ageHours / 24)}d)
                        </div>
                      )}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                      {t.assignedTo?.name ? (
                        <span style={{ color: '#0f172a', fontWeight: '600' }}>
                          {t.assignedTo.name}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', color: '#64748b' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTicket(t);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total tickets)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-secondary btn-sm"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
