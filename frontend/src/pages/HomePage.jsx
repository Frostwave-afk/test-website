import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { FormsAPI, AuthAPI, formatDate } from '../api/client';

const FORM_CARDS = [
  {
    id: 'rating',
    icon: '📋',
    title: 'Subject Rating Form',
    desc: 'Rate 10 subjects from 1 to 10. Share personal info, gender, and languages spoken. Takes approximately 3 minutes.',
    deadline: 'Academic Year 2024-25',
    tags: ['10 Subjects'],
    active: true,
  },
  {
    id: 'faculty',
    icon: '👨‍🏫',
    title: 'Faculty Feedback Form',
    desc: 'Rate individual faculty members on teaching effectiveness, communication, and subject knowledge.',
    deadline: 'Coming Soon',
    tags: [],
    active: false,
  },
  {
    id: 'infra',
    icon: '🏛️',
    title: 'Infrastructure Feedback',
    desc: 'Evaluate college infrastructure — classrooms, labs, library, canteen, and sports facilities.',
    deadline: 'Coming Soon',
    tags: [],
    active: false,
  },
];

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formStatus, setFormStatus] = useState('pending'); // 'pending' | 'submitted'
  const [memberSince, setMemberSince] = useState('—');
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    const tod = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    setGreeting(tod);
    loadData();
  }, []);

  async function loadData() {
    try {
      const { form } = await FormsAPI.getMyForm();
      if (form) {
        setFormStatus('submitted');
        localStorage.setItem('crs_form_id', form.id);
      } else {
        setFormStatus('pending');
        localStorage.removeItem('crs_form_id');
      }
    } catch {}

    try {
      const meData = await AuthAPI.getMe();
      const createdAt = meData.user?.created_at;
      setMemberSince(createdAt
        ? new Date(createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : 'Today');
    } catch {}

    setLoading(false);
  }

  const firstName = user?.firstName || user?.first_name || 'Student';
  const lastName  = user?.lastName  || user?.last_name  || '';
  const fullName  = `${firstName} ${lastName}`.trim();
  const initials  = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();
  const submitted = formStatus === 'submitted';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function switchSection(path) {
    closeSidebar();
    navigate(path);
  }

  return (
    <div className="page-wrapper">
      <Navbar onHamburgerClick={() => setSidebarOpen(v => !v)} showHamburger />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-name">{fullName}</div>
            <div className="sidebar-role">Student</div>
          </div>

          <nav className="sidebar-nav">
            {[
              { id: 'home', icon: 'fa-home',            label: 'Home',       path: '/' },
              { id: 'profile', icon: 'fa-user-cog', label: 'My Profile', path: '/profile' },
              { id: 'help', icon: 'fa-question-circle', label: 'Help',       path: '/help' },
            ].map(item => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${item.id === 'home' ? 'active' : ''}`}
                onClick={() => switchSection(item.path)}
                id={`student-nav-${item.id}`}
              >
                <span className="nav-icon"><i className={`fas ${item.icon}`} /></span>
                {item.label}
              </button>
            ))}

            <div className="sidebar-divider" />

            <button
              className="sidebar-nav-item"
              onClick={() => switchSection('/form')}
              id="student-nav-form"
            >
              <span className="nav-icon"><i className={`fas ${submitted ? 'fa-edit' : 'fa-pen'}`} /></span>
              {submitted ? 'Edit Form' : 'Fill Form'}
            </button>

            <div className="sidebar-divider" />

            <button
              className="sidebar-nav-item danger"
              onClick={handleLogout}
              id="student-nav-logout"
            >
              <span className="nav-icon"><i className="fas fa-sign-out-alt" /></span>
              Logout
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          <div style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
            {/* Hero */}
            <div style={{ paddingBottom: 36, borderBottom: '1px solid var(--border)', marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800 }}>
                    {greeting}, <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span>! 👋
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>
                    Here are your available forms for this academic year.
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/form')} id="mainFormBtn">
                  <i className={`fas ${submitted ? 'fa-edit' : 'fa-star'}`} /> {submitted ? 'Edit Form' : 'Rate Subjects'}
                </button>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid-3" style={{ marginBottom: 40 }}>
              <div className="stat-card">
                <div className="stat-icon purple"><i className="fas fa-clipboard-list" /></div>
                <div className="stat-info">
                  <div className="stat-value">1</div>
                  <div className="stat-label">Forms Available</div>
                </div>
              </div>
              <div className="stat-card">
                <div className={`stat-icon ${submitted ? 'green' : 'teal'}`}>
                  <i className={`fas ${submitted ? 'fa-check-circle' : 'fa-hourglass-half'}`} />
                </div>
                <div className="stat-info">
                  <div className="stat-value" id="formStatusValue">{submitted ? 'Submitted' : 'Pending'}</div>
                  <div className="stat-label">Form Status</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pink"><i className="fas fa-calendar-alt" /></div>
                <div className="stat-info">
                  <div className="stat-value" id="memberSince">{memberSince}</div>
                  <div className="stat-label">Member Since</div>
                </div>
              </div>
            </div>

            {/* Welcome banner */}
            {!loading && !submitted && (
              <div style={{
                background: 'linear-gradient(135deg, hsl(251,75%,12%), hsl(280,70%,10%))',
                border: '1px solid hsl(251,75%,25%)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px 28px',
                marginBottom: 36,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                animation: 'fadeUp 0.4s ease',
                flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>📝</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                    You haven't filled your rating form yet!
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Take 2 minutes to rate your 10 subjects and help improve education quality.
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/form')} style={{ flexShrink: 0 }}>
                  Fill Now <i className="fas fa-arrow-right" />
                </button>
              </div>
            )}

            {/* Forms grid */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div className="section-heading" style={{ flex: 1, marginBottom: 0 }}>Available Forms</div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Academic Year 2024–25</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {FORM_CARDS.map(card => (
                <FormCard
                  key={card.id}
                  card={card}
                  submitted={card.id === 'rating' ? submitted : false}
                  onClick={() => card.active && navigate('/form')}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function FormCard({ card, submitted, onClick }) {
  const inactive = !card.active;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: inactive ? 'not-allowed' : 'pointer',
        opacity: inactive ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: inactive ? 'var(--border)' : 'var(--gradient-brand)',
        borderRadius: '20px 20px 0 0',
      }} />

      {/* Submitted ribbon */}
      {submitted && (
        <div style={{
          position: 'absolute', top: 14, right: -22,
          background: 'var(--success)', color: 'white',
          fontSize: '0.65rem', fontWeight: 700, padding: '3px 28px',
          transform: 'rotate(35deg)', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>Done</div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 13, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.5rem',
          background: inactive ? 'var(--bg-overlay)' : 'hsl(251,75%,12%)',
          border: `1px solid ${inactive ? 'var(--border)' : 'hsl(251,75%,22%)'}`,
          flexShrink: 0,
        }}>
          {card.icon}
        </div>
        {card.active && (
          submitted
            ? <span className="badge badge-success"><i className="fas fa-check" /> Submitted</span>
            : <span className="badge badge-warning"><i className="fas fa-clock" /> Pending</span>
        )}
        {!card.active && <span className="badge" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}><i className="fas fa-lock" /> Locked</span>}
      </div>

      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{card.title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.6 }}>{card.desc}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fas fa-calendar" /> {card.deadline}
        </span>
        {card.tags.map(t => <span key={t} className="chip"><i className="fas fa-book" /> {t}</span>)}
      </div>

      <button
        className={`btn ${submitted ? 'btn-secondary' : card.active ? 'btn-primary' : 'btn-ghost'} btn-full`}
        disabled={!card.active}
        onClick={e => { e.stopPropagation(); card.active && onClick(); }}
      >
        {!card.active
          ? <><i className="fas fa-lock" /> Locked</>
          : submitted
          ? <><i className="fas fa-edit" /> Edit Responses</>
          : <><i className="fas fa-pen" /> Fill Form</>
        }
      </button>
    </div>
  );
}
