import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import AuthorOverview from './components/AuthorOverview';
import AuthorBooks from './components/AuthorBooks';
import AuthorNewTicket from './components/AuthorNewTicket';
import AuthorTickets from './components/AuthorTickets';
import TicketThreadModal from './components/TicketThreadModal';
import AdminOverview from './components/AdminOverview';
import AdminQueue from './components/AdminQueue';
import AdminTicketDrawer from './components/AdminTicketDrawer';
import {
  LayoutDashboard,
  Inbox,
  UserCheck,
  BookOpen,
  PlusCircle,
  LogOut
} from 'lucide-react';

function MainApp() {
  const { user, loading, logout } = useAuth();

  const [adminTab, setAdminTab] = useState('dashboard');
  const [authorTab, setAuthorTab] = useState('dashboard');

  const [activeAdminTicketId, setActiveAdminTicketId] = useState(null);
  const [adminExternalFilter, setAdminExternalFilter] = useState(null);
  const [selectedBookForTicket, setSelectedBookForTicket] = useState(null);
  const [activeAuthorTicketId, setActiveAuthorTicketId] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#0f5132',
          fontWeight: '700'
        }}
      >
        Loading BookLeaf Author Portal...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = user.role === 'admin';

  const handleAskQuestionAboutBook = (book) => {
    setSelectedBookForTicket(book);
    setAuthorTab('submit-query');
  };

  const handleTicketCreated = (newTicket) => {
    setAuthorTab('tickets');
    setActiveAuthorTicketId(newTicket._id);
  };

  const handleAdminDashboardNavigate = (filter) => {
    setAdminExternalFilter(filter);
    setAdminTab('tickets');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
      <aside
        style={{
          width: '240px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 40
        }}
      >
        <div
          style={{
            height: '64px',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#0f5132',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.0625rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
              BookLeaf
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              {isAdmin ? 'Operations Desk' : 'Author Portal'}
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {isAdmin ? (
            <>
              <button
                type="button"
                className={`sidebar-nav-item ${adminTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setAdminTab('dashboard');
                  setAdminExternalFilter(null);
                }}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${adminTab === 'tickets' ? 'active' : ''}`}
                onClick={() => {
                  setAdminTab('tickets');
                  setAdminExternalFilter(null);
                }}
              >
                <Inbox size={18} />
                <span>Tickets</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${adminTab === 'my-assigned' ? 'active' : ''}`}
                onClick={() => setAdminTab('my-assigned')}
              >
                <UserCheck size={18} />
                <span>My Assigned Tickets</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`sidebar-nav-item ${authorTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setAuthorTab('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${authorTab === 'books' ? 'active' : ''}`}
                onClick={() => setAuthorTab('books')}
              >
                <BookOpen size={18} />
                <span>My Books</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${authorTab === 'tickets' ? 'active' : ''}`}
                onClick={() => setAuthorTab('tickets')}
              >
                <Inbox size={18} />
                <span>My Tickets</span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${authorTab === 'submit-query' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedBookForTicket(null);
                  setAuthorTab('submit-query');
                }}
              >
                <PlusCircle size={18} />
                <span>Submit a Query</span>
              </button>
            </>
          )}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            className="sidebar-nav-item"
            style={{ color: '#dc2626' }}
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar />

        <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {isAdmin ? (
            <div>
              {adminTab === 'dashboard' && (
                <AdminOverview
                  onOpenTicket={(ticket) => setActiveAdminTicketId(ticket._id)}
                  onNavigateToTickets={handleAdminDashboardNavigate}
                />
              )}

              {adminTab === 'tickets' && (
                <AdminQueue
                  externalFilter={adminExternalFilter}
                  onOpenTicket={(ticket) => setActiveAdminTicketId(ticket._id)}
                />
              )}

              {adminTab === 'my-assigned' && (
                <AdminQueue
                  isAssignedOnly={true}
                  onOpenTicket={(ticket) => setActiveAdminTicketId(ticket._id)}
                />
              )}

              {activeAdminTicketId && (
                <AdminTicketDrawer
                  ticketId={activeAdminTicketId}
                  onClose={() => setActiveAdminTicketId(null)}
                  onTicketUpdated={() => {}}
                />
              )}
            </div>
          ) : (
            <div>
              {authorTab === 'dashboard' && (
                <AuthorOverview
                  setActiveTab={setAuthorTab}
                  onSelectTicket={(ticket) => setActiveAuthorTicketId(ticket._id)}
                  onAskQuestion={handleAskQuestionAboutBook}
                />
              )}

              {authorTab === 'books' && (
                <AuthorBooks onAskQuestion={handleAskQuestionAboutBook} />
              )}

              {authorTab === 'tickets' && (
                <AuthorTickets
                  onSelectTicket={(ticket) => setActiveAuthorTicketId(ticket._id)}
                  onNavigateToSubmit={() => setAuthorTab('submit-query')}
                />
              )}

              {authorTab === 'submit-query' && (
                <AuthorNewTicket
                  preSelectedBook={selectedBookForTicket}
                  onTicketCreated={handleTicketCreated}
                />
              )}

              {activeAuthorTicketId && (
                <TicketThreadModal
                  ticketId={activeAuthorTicketId}
                  onClose={() => setActiveAuthorTicketId(null)}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
