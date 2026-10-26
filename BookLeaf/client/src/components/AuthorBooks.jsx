import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Search, Filter, HelpCircle } from 'lucide-react';

export default function AuthorBooks({ onAskQuestion }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await api.getMyBooks({
        search,
        status: statusFilter === 'ALL' ? '' : statusFilter
      });
      if (res.success) {
        setBooks(res.books || []);
      }
    } catch (err) {
      console.error('Error fetching author books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [search, statusFilter]);

  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
          My Books
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Registered publications, retail status, and financial royalty breakdowns.
        </p>
      </div>

      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search book title, ISBN, genre..."
            className="form-input"
            style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#64748b" />
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '600' }}>Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8125rem', padding: '6px 12px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Published & Live">Published & Live</option>
            <option value="In Production - Typesetting">In Production - Typesetting</option>
            <option value="In Production - Cover Design">In Production - Cover Design</option>
            <option value="In Production - Proofreading">In Production - Proofreading</option>
            <option value="In Production - Printing">In Production - Printing</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading your books...
        </div>
      ) : books.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
          No books found matching the selected search/filter.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Publication Date</th>
                <th>Publication Status</th>
                <th>MRP</th>
                <th>Copies Sold</th>
                <th>Total Royalty Earned</th>
                <th>Royalty Paid</th>
                <th>Royalty Pending</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => {
                const isLive = b.status === 'Published & Live';
                return (
                  <tr key={b._id}>
                    <td style={{ fontWeight: '700', color: '#0f172a', maxWidth: '240px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{b.bookId}</div>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{b.isbn}</td>

                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{b.genre || 'General'}</td>

                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', color: '#64748b' }}>
                      {b.publicationDate || 'In Pipeline'}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: isLive ? '#dcfce7' : '#fef3c7',
                          color: isLive ? '#15803d' : '#92400e',
                          border: `1px solid ${isLive ? '#bbf7d0' : '#fde68a'}`
                        }}
                      >
                        {b.status}
                      </span>
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontWeight: '600' }}>{formatINR(b.mrp)}</td>

                    <td style={{ whiteSpace: 'nowrap', fontWeight: '700', color: '#0f172a' }}>
                      {(b.totalCopiesSold || 0).toLocaleString('en-IN')}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontWeight: '700', color: '#0f172a' }}>
                      {formatINR(b.totalRoyaltyEarned)}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#15803d' }}>
                      {formatINR(b.royaltyPaid)}
                    </td>

                    <td style={{ whiteSpace: 'nowrap', fontWeight: '700', color: '#b45309' }}>
                      {formatINR(b.royaltyPending)}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => onAskQuestion && onAskQuestion(b)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        title="Submit support query regarding this title"
                      >
                        <HelpCircle size={13} color="#0f5132" />
                        <span>Query</span>
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
  );
}
