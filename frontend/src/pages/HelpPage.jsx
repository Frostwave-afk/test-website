import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';

const SECTIONS = [
  {
    title: 'Getting Started',
    icon: 'fa-rocket',
    items: [
      { q: 'How do I create an account?', a: 'Click "Create account" on the login page. Enter your first name, last name, college email, and a password. You will be redirected to the dashboard immediately after registration. You can also use Google Sign-In to create or access your account quickly.' },
      { q: 'I forgot my password. What do I do?', a: 'Contact your college administrator to reset your password. Admins can reset student passwords through the admin panel. Alternatively, you can use Google Sign-In to access your account.' },
      { q: 'Can I log in with Google?', a: 'Yes! Click "Continue with Google" on the login page to sign in with your Google account. Your account will be created automatically on your first sign-in, or linked to your existing email account if you already have one.' },
    ],
  },
  {
    title: 'Rating Form',
    icon: 'fa-clipboard-list',
    items: [
      { q: 'How many subjects do I need to rate?', a: 'You need to rate all 10 subjects: English, Hindi, Biology, Physics, Chemistry, Mathematics, History, Geography, Computer Science, and Economics.' },
      { q: 'What do the ratings mean?', a: 'Ratings go from 1 (poor) to 10 (excellent). Each number represents your experience with that subject\'s teaching and learning quality.' },
      { q: 'Can I edit my form after submission?', a: 'Yes! You can update your ratings at any time by clicking "Edit Form" on the home page. Your latest submission replaces the previous one.' },
      { q: 'The form won\'t submit. What should I do?', a: 'Make sure all 10 subjects are rated and all personal info fields (phone, gender, at least one language) are filled. Check your internet connection and try again.' },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: 'fa-shield-alt',
    items: [
      { q: 'Is my feedback anonymous?', a: 'Your feedback is submitted under your account but is only viewable by college administrators. Individual ratings are not publicly displayed.' },
      { q: 'Who can see my form responses?', a: 'Only college administrators with admin portal access can view individual form submissions. Your ratings are confidential.' },
      { q: 'Is my data secure?', a: 'Yes. All data is transmitted over HTTPS and stored securely. Passwords are hashed and never stored in plain text.' },
    ],
  },
  {
    title: 'Technical Issues',
    icon: 'fa-wrench',
    items: [
      { q: 'The page is not loading. What can I do?', a: 'Try refreshing the page or clearing your browser cache. Make sure you have a stable internet connection.' },
      { q: 'My session expired. Why was I logged out?', a: 'Sessions expire automatically for security. Simply log in again — your submitted data is still saved.' },
      { q: 'I see an error message. Who should I contact?', a: 'Take a screenshot of the error and contact your college administrator or system support team.' },
    ],
  },
];

export default function HelpPage() {
  const [open, setOpen]   = useState({});
  const [query, setQuery] = useState('');

  function toggle(key) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(
        item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter(s => s.items.length > 0);
  }, [query]);

  const totalResults = filtered.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container page-content" style={{ maxWidth: 740 }}>

        {/* ── Compact header ── */}
        <div style={{ textAlign: 'center', padding: '28px 0 24px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
            fontWeight: 800,
            marginBottom: 6,
          }}>
            Help &amp; FAQ
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
            Find answers to common questions about the College Rating System.
          </p>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 460, margin: '0 auto' }}>
            <i className="fas fa-search" style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none',
            }} />
            <input
              id="helpSearch"
              type="text"
              placeholder="Search questions…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px 11px 42px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'hsl(251,75%,45%)')}
              onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  padding: 4, fontSize: '0.8rem',
                }}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          {/* Result count when searching */}
          {query && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 10 }}>
              {totalResults === 0
                ? 'No results found'
                : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"`}
            </p>
          )}
        </div>

        {/* ── FAQ sections ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <i className="fas fa-search" style={{ fontSize: '2rem', opacity: 0.4, marginBottom: 12, display: 'block' }} />
            <p>No questions match your search. Try different keywords.</p>
          </div>
        ) : (
          filtered.map(section => (
            <div key={section.title} style={{ marginBottom: 24 }}>
              {/* Section label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--primary-light)',
                marginBottom: 8,
              }}>
                <i className={`fas ${section.icon}`} />
                {section.title}
              </div>

              {/* Accordion items — tighter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {section.items.map((item, i) => {
                  const key = `${section.title}-${i}`;
                  const isOpen = open[key];
                  return (
                    <div key={key} style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isOpen ? 'hsl(251,75%,30%)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}>
                      <button
                        onClick={() => toggle(key)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', gap: 12,
                          padding: '13px 16px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--font-body)', fontWeight: 600,
                          fontSize: '0.875rem',
                          color: isOpen ? 'var(--primary-light)' : 'var(--text-primary)',
                          textAlign: 'left', transition: 'color 0.2s',
                        }}
                      >
                        <span>{item.q}</span>
                        <i
                          className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
                          style={{ fontSize: '0.72rem', flexShrink: 0, color: 'var(--text-muted)', transition: 'transform 0.2s' }}
                        />
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: '0 16px 14px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.855rem',
                          lineHeight: 1.65,
                          animation: 'fadeIn 0.15s ease',
                        }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* ── Contact card ── compact ── */}
        <div style={{
          background: 'var(--gradient-brand)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 32,
          boxShadow: '0 8px 32px hsl(251,75%,40%,0.2)',
        }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
            Still need help?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', marginBottom: 16 }}>
            Contact your college administrator for personalized assistance.
          </p>
          <a
            href="mailto:admin@college.edu"
            className="btn"
            style={{
              background: 'rgba(255,255,255,0.18)', color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)', fontSize: '0.875rem', padding: '9px 22px',
            }}
          >
            <i className="fas fa-envelope" /> Contact Admin
          </a>
        </div>

      </div>
    </div>
  );
}
