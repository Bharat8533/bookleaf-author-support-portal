import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  DollarSign,
  ShoppingBag,
  Clock,
  PlusCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function AuthorOverview({ setActiveTab, onSelectTicket, onAskQuestion }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBooks, setRecentBooks] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, booksRes, ticketsRes] = await Promise.all([
          api.getAuthorStats(),
          api.getMyBooks(),
          api.getTickets()
        ]);
        if (statsRes.success) setStats(statsRes.stats);
        if (booksRes.success) setRecentBooks((booksRes.books || []).slice(0, 3));
        if (ticketsRes.success) setRecentTickets((ticketsRes.tickets || []).slice(0, 3));
      } catch (err) {
        console.error('Error loading author overview:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading author dashboard...
      </div>
    );
  }

  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.375rem', fontWeight: '800', color: '#0f172a' }}>
              Welcome back, {user?.name}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#e8f5e9',
                color: '#15803d'
              }}
            >
              {user?.authorId || 'Author'}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Your BookLeaf Author Dashboard • Real-time sales, royalties, and direct support.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('submit-query')}
          className="btn btn-primary"
          style={{ padding: '10px 18px', fontSize: '0.875rem' }}
        >
          <PlusCircle size={16} />
          <span>Submit a Query</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Total Books</span>
            <BookOpen size={18} color="#0f5132" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {stats?.totalBooks || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            Catalog titles registered
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Published Books</span>
            <CheckCircle size={18} color="#15803d" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#15803d' }}>
            {stats?.publishedBooks !== undefined ? stats.publishedBooks : stats?.totalBooks || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            Live in circulation
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Copies Sold</span>
            <ShoppingBag size={18} color="#7e22ce" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {(stats?.totalCopiesSold || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            All retail platforms
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Royalty Earned</span>
            <DollarSign size={18} color="#0f5132" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {formatINR(stats?.totalRoyaltyEarned)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            80% net profit share
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Royalty Paid</span>
            <CheckCircle size={18} color="#15803d" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#15803d' }}>
            {formatINR(stats?.royaltyPaid)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            Disbursed to bank account
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '18px',
            background: stats?.royaltyPending > 0 ? '#fffbeb' : '#ffffff',
            borderColor: stats?.royaltyPending > 0 ? '#fde68a' : 'var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#92400e', fontWeight: '600' }}>Royalty Pending</span>
            <Clock size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b45309' }}>
            {formatINR(stats?.royaltyPending)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
            Scheduled next cycle (₹1k min)
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#0f172a' }}>My Books</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Recent titles from your catalog</p>
            </div>
            <button
              onClick={() => setActiveTab('books')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              View All Books <ArrowRight size={13} />
            </button>
          </div>

          {recentBooks.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              No books registered under your author account yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentBooks.map((b) => (
                <div
                  key={b._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0f172a' }}>{b.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      ISBN: {b.isbn} • {b.totalCopiesSold || 0} copies sold
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.6875rem',
                        fontWeight: '700',
                        background: b.status === 'Published & Live' ? '#dcfce7' : '#fef3c7',
                        color: b.status === 'Published & Live' ? '#15803d' : '#92400e'
                      }}
                    >
                      {b.status}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '600', marginTop: '4px' }}>
                      Pending: {formatINR(b.royaltyPending)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#0f172a' }}>Recent Queries</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Latest support communications</p>
            </div>
            <button
              onClick={() => setActiveTab('tickets')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              View All Tickets <ArrowRight size={13} />
            </button>
          </div>

          {recentTickets.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
              No support tickets raised yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentTickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => onSelectTicket && onSelectTicket(t)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.75rem', color: '#0f5132' }}>
                        {t.ticketNumber}
                      </span>
                      <span className="badge badge-category" style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>
                        {t.category}
                      </span>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.subject}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.status}
                    </span>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
