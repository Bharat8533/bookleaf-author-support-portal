import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function AdminOverview({ onOpenTicket, onNavigateToTickets }) {
  const [stats, setStats] = useState(null);
  const [urgentTickets, setUrgentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatsAndTickets = async () => {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.getAdminStats(),
        api.getTickets({ sortBy: 'urgency', limit: 8 })
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (ticketsRes.success) {
        const unresolved = (ticketsRes.tickets || []).filter(
          (t) => t.status === 'Open' || t.status === 'In Progress'
        );
        setUrgentTickets(unresolved.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndTickets();

    const socket = getSocket();
    socket.on('ticket:created', fetchStatsAndTickets);
    socket.on('ticket:status-updated', fetchStatsAndTickets);
    socket.on('ticket:message', fetchStatsAndTickets);

    return () => {
      socket.off('ticket:created', fetchStatsAndTickets);
      socket.off('ticket:status-updated', fetchStatsAndTickets);
      socket.off('ticket:message', fetchStatsAndTickets);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  const criticalAndHighCount = (stats?.criticalTickets || 0) + (stats?.highTickets || 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
          Operations Dashboard
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Overview of support ticket volume, urgent escalations, and active queue health.
        </p>
      </div>

      {stats?.overdueTickets > 0 && (
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#e11d48" />
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9f1239' }}>
              <strong>SLA Alert:</strong> {stats.overdueTickets} unresolved ticket{stats.overdueTickets === 1 ? '' : 's'} older than 48 hours.
            </span>
          </div>
          <button
            onClick={() => onNavigateToTickets && onNavigateToTickets({ sortBy: 'aging' })}
            className="btn btn-sm"
            style={{ background: '#be123c', color: '#ffffff', border: 'none', fontSize: '0.75rem' }}
          >
            View Oldest Unresolved
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div
          className="card"
          style={{ padding: '20px', cursor: 'pointer' }}
          onClick={() => onNavigateToTickets && onNavigateToTickets({ status: 'ALL' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b' }}>Total Tickets</span>
            <Inbox size={20} color="#0f5132" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>
            {stats?.totalTickets || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            All-time author queries submitted
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '20px', cursor: 'pointer', borderLeft: '4px solid #d97706' }}
          onClick={() => onNavigateToTickets && onNavigateToTickets({ status: 'Open' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#92400e' }}>Open Tickets</span>
            <Clock size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#92400e' }}>
            {stats?.openTickets || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Awaiting first review or assignment
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '20px', cursor: 'pointer', borderLeft: '4px solid #0284c7' }}
          onClick={() => onNavigateToTickets && onNavigateToTickets({ status: 'In Progress' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#0369a1' }}>In-Progress Tickets</span>
            <CheckCircle size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0369a1' }}>
            {stats?.inProgressTickets || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Under active investigation or response
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '20px',
            cursor: 'pointer',
            borderLeft: '4px solid #e11d48',
            background: criticalAndHighCount > 0 ? '#fff1f2' : '#ffffff'
          }}
          onClick={() => onNavigateToTickets && onNavigateToTickets({ priority: 'Critical' })}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#be123c' }}>
              Critical / High Unresolved
            </span>
            <AlertTriangle size={20} color="#e11d48" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#be123c' }}>
            {criticalAndHighCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#be123c', marginTop: '4px' }}>
            {stats?.criticalTickets || 0} Critical • {stats?.highTickets || 0} High
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0f172a' }}>
              Recent & Urgent Unresolved Tickets
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              High-priority tickets requiring immediate admin response or investigation
            </p>
          </div>
          <button
            onClick={() => onNavigateToTickets && onNavigateToTickets({ status: 'Open' })}
            className="btn btn-secondary btn-sm"
          >
            <span>View All Tickets</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {urgentTickets.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            No unresolved urgent tickets at this moment.
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {urgentTickets.map((t) => {
                  const isCritical = t.priority === 'Critical';
                  return (
                    <tr
                      key={t._id}
                      className={isCritical ? 'row-urgent' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onOpenTicket && onOpenTicket(t)}
                    >
                      <td style={{ fontWeight: '700', color: '#0f5132' }}>{t.ticketNumber}</td>
                      <td style={{ fontWeight: '600', maxWidth: '300px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t.bookTitle}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{t.authorName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.authorEmail}</div>
                      </td>
                      <td>
                        <span className="badge badge-category">{t.category}</span>
                      </td>
                      <td>
                        <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTicket && onOpenTicket(t);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
