import React from 'react';
import Navbar from '../components/Navbar';

const SECTIONS = [
  {
    title: 'Getting Started',
    icon: 'fa-rocket',
    items: [
      { q: 'How do I create an account?', a: 'Click "Create account" on the login page. Enter your first name, last name, college email, and a password. You will be redirected to the dashboard immediately after registration.' },
      { q: 'I forgot my password. What do I do?', a: 'Contact your college administrator to reset your password. Automated password reset via email is not yet available.' },
      { q: 'Can I log in with Google?', a: 'Google Sign-In is coming soon! For now, please use your email and password to sign in.' },
    ]
  },
  {
    title: 'Rating Form',
    icon: 'fa-clipboard-list',
    items: [
      { q: 'How many subjects do I need to rate?', a: 'You need to rate all 10 subjects: English, Hindi, Biology, Physics, Chemistry, Mathematics, History, Geography, Computer Science, and Economics.' },
      { q: 'What do the ratings mean?', a: 'Ratings go from 1 (poor) to 10 (excellent). Each number represents your experience with that subject\'s teaching and learning quality.' },
      { q: 'Can I edit my form after submission?', a: 'Yes! You can update your ratings at any time by clicking "Edit Form" on the home page. Your latest submission replaces the previous one.' },
      { q: 'The form won\'t submit. What should I do?', a: 'Make sure all 10 subjects are rated and all personal info fields (phone, gender, at least one language) are filled. Check your internet connection and try again.' },
    ]
  },
  {
    title: 'Privacy & Security',
    icon: 'fa-shield-alt',
    items: [
      { q: 'Is my feedback anonymous?', a: 'Your feedback is submitted under your account but is only viewable by college administrators. Individual ratings are not publicly displayed.' },
      { q: 'Who can see my form responses?', a: 'Only college administrators with admin portal access can view individual form submissions. Your ratings are confidential.' },
      { q: 'Is my data secure?', a: 'Yes. All data is transmitted over HTTPS and stored securely. Passwords are hashed and never stored in plain text.' },
    ]
  },
  {
    title: 'Technical Issues',
    icon: 'fa-wrench',
    items: [
      { q: 'The page is not loading. What can I do?', a: 'Try refreshing the page or clearing your browser cache. Make sure you have a stable internet connection.' },
      { q: 'My session expired. Why was I logged out?', a: 'Sessions expire automatically for security. Simply log in again — your submitted data is still saved.' },
      { q: 'I see an error message. Who should I contact?', a: 'Take a screenshot of the error and contact your college administrator or system support team.' },
    ]
  },
];

export default function HelpPage() {
  const [open, setOpen] = React.useState({});

  function toggle(key) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container page-content">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 'clamp(48px, 10vw, 64px)', height: 'clamp(48px, 10vw, 64px)', borderRadius: 18, marginBottom: 16,
            background: 'hsl(251,75%,12%)', border: '1px solid hsl(251,75%,22%)', fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          }}>💡</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 10 }}>Help & FAQ</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
            Find answers to common questions about using the College Rating System.
          </p>
        </div>

        {/* Quick links */}
        <div className="grid-4" style={{ marginBottom: 40 }}>
          {SECTIONS.map(s => (
            <a key={s.title} href={`#section-${s.title.replace(/\s/g, '-')}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, 
                padding: 'clamp(12px, 3vw, 20px)',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 500, textDecoration: 'none',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(251,75%,30%)'; e.currentTarget.style.color = 'var(--primary-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'hsl(251,75%,12%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)', flexShrink: 0 }}>
                <i className={`fas ${s.icon}`} />
              </div>
              {s.title}
            </a>
          ))}
        </div>

        {/* FAQ Sections */}
        {SECTIONS.map(section => (
          <div key={section.title} id={`section-${section.title.replace(/\s/g, '-')}`} style={{ marginBottom: 40 }}>
            <div className="section-heading">
              <i className={`fas ${section.icon}`} style={{ color: 'var(--primary-light)' }} /> {section.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map((item, i) => {
                const key = `${section.title}-${i}`;
                const isOpen = open[key];
                return (
                  <div key={key} style={{
                    background: 'var(--bg-card)', border: `1px solid ${isOpen ? 'hsl(251,75%,28%)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'var(--transition)',
                  }}>
                    <button
                      onClick={() => toggle(key)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'clamp(12px, 3vw, 20px)', background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        color: isOpen ? 'var(--primary-light)' : 'var(--text-primary)',
                        textAlign: 'left', gap: 12, transition: 'color 0.2s',
                      }}
                    >
                      {item.q}
                      <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', flexShrink: 0, color: isOpen ? 'var(--primary-light)' : 'var(--text-muted)', transition: 'transform 0.2s' }} />
                    </button>
                    {isOpen && (
                      <div style={{ padding: 'clamp(12px, 3vw, 20px)', color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', lineHeight: 1.7, borderTop: '1px solid var(--border)', animation: 'fadeIn 0.2s ease' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact card */}
        <div style={{
          background: 'var(--gradient-brand)', borderRadius: 'var(--radius-2xl)',
          padding: 'clamp(24px, 6vw, 40px)', textAlign: 'center', marginTop: 20,
          boxShadow: '0 8px 32px hsl(251,75%,40%,0.25)',
        }}>
          <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', marginBottom: 12 }}>🎓</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 3vw, 1.3rem)', fontWeight: 700, color: 'white', marginBottom: 8 }}>
            Still need help?
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', marginBottom: 24 }}>
            Contact your college administrator for personalized assistance with your account or submissions.
          </p>
          <a href="mailto:admin@college.edu" className="btn" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
            <i className="fas fa-envelope" /> Contact Admin
          </a>
        </div>

      </div>
    </div>
  );
}
