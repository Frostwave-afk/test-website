import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FormsAPI } from '../api/client';
import { useToast } from '../context/ToastContext';

const SUBJECTS = [
  { key: 'english',          label: 'English',          icon: '📖' },
  { key: 'hindi',            label: 'Hindi',            icon: '🇮🇳' },
  { key: 'biology',          label: 'Biology',          icon: '🧬' },
  { key: 'physics',          label: 'Physics',          icon: '⚛️' },
  { key: 'chemistry',        label: 'Chemistry',        icon: '🧪' },
  { key: 'mathematics',      label: 'Mathematics',      icon: '📐' },
  { key: 'history',          label: 'History',          icon: '🏛️' },
  { key: 'geography',        label: 'Geography',        icon: '🌍' },
  { key: 'computer_science', label: 'Computer Science', icon: '💻' },
  { key: 'economics',        label: 'Economics',        icon: '📈' },
];

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Tamil', 'Telugu', 'Other'];
const LANGUAGE_FLAGS = { English: '🇬🇧', Hindi: '🇮🇳', Marathi: '🌺', Gujarati: '🦁', Bengali: '🌊', Tamil: '🌴', Telugu: '🏛️', Other: '🌐' };

export default function FormPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep]                   = useState(1);
  const [editMode, setEditMode]           = useState(false);
  const [existingFormId, setExistingFormId] = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [success, setSuccess]             = useState(false);

  // Step 1
  const [phone, setPhone]         = useState('');
  const [gender, setGender]       = useState('');
  const [languages, setLanguages] = useState([]);
  const [step1Errors, setStep1Errors] = useState({});

  // Step 2
  const [ratings, setRatings]       = useState({});
  const [errorSubjects, setErrorSubjects] = useState([]);

  useEffect(() => { loadExistingForm(); }, []);

  async function loadExistingForm() {
    try {
      const { form } = await FormsAPI.getMyForm();
      if (!form) return;
      setExistingFormId(form.id);
      setEditMode(true);
      setPhone(form.phone || '');
      if (form.gender) setGender(form.gender);
      let langs = form.languages;
      if (typeof langs === 'string') { try { langs = JSON.parse(langs); } catch { langs = []; } }
      if (Array.isArray(langs)) setLanguages(langs);
      const preRatings = {};
      SUBJECTS.forEach(s => { if (form[s.key]) preRatings[s.key] = parseInt(form[s.key]); });
      setRatings(preRatings);
    } catch {}
  }

  // ── Step 1 Validation ─────────────────────────────────────────────────────
  function validateStep1() {
    const errs = {};
    if (!phone) errs.phone = 'Phone number is required.';
    else if (!/^\d{10}$/.test(phone)) errs.phone = 'Phone must be exactly 10 digits.';
    if (!gender) errs.gender = 'Please select your gender.';
    if (languages.length === 0) errs.languages = 'Please select at least one language.';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNextStep() {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      const unrated = SUBJECTS.filter(s => !ratings[s.key]);
      if (unrated.length > 0) {
        setErrorSubjects(unrated.map(s => s.key));
        showToast(`Please rate all subjects. Missing: ${unrated.map(s => s.label).join(', ')}`, 'error', 5000);
        return;
      }
      setErrorSubjects([]);
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePrevStep() {
    if (step > 1) { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  function selectRating(key, value) {
    setRatings(prev => ({ ...prev, [key]: value }));
    setErrorSubjects(prev => prev.filter(k => k !== key));
  }

  function toggleLanguage(lang) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  }

  async function handleSubmit() {
    const payload = {
      phone, gender, languages,
      ...Object.fromEntries(SUBJECTS.map(s => [s.key, ratings[s.key]]))
    };
    setSubmitting(true);
    try {
      if (existingFormId) {
        await FormsAPI.update(existingFormId, payload);
        showToast('Form updated successfully!', 'success');
      } else {
        const result = await FormsAPI.submit(payload);
        localStorage.setItem('crs_form_id', result.formId);
        showToast('Form submitted successfully!', 'success');
      }
      setSuccess(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const totalSteps = 3;
  const progress = success ? 100 : Math.round(((step - 1) / totalSteps) * 100);

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="container" style={{ maxWidth: 640, padding: 'clamp(40px, 8vw, 80px) clamp(12px, 5vw, 24px)', textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'hsl(152, 69%, 10%)', border: '2px solid hsl(152, 69%, 30%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', margin: '0 auto 28px', animation: 'pulse 2s infinite',
          }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: 12 }}>
            {editMode ? 'Form Updated!' : 'Form Submitted!'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 32 }}>
            Thank you for rating your subjects. Your feedback helps improve the quality of education.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <i className="fas fa-home" /> Back to Home
            </button>
            <button className="btn btn-secondary" onClick={() => { setSuccess(false); setStep(1); window.scrollTo(0, 0); }}>
              <i className="fas fa-edit" /> Edit Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ maxWidth: 780, paddingTop: 40, paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="page-title">Complete Your Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {editMode ? 'Edit your previous submission' : 'Tell us about yourself'}
          </p>
          {editMode && (
            <div style={{ marginTop: 10 }}>
              <span className="badge badge-info"><i className="fas fa-edit" /> Editing Your Profile</span>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          {['Your Info', 'Subject Ratings', 'Review & Submit'].map((label, i) => {
            const n = i + 1;
            const isActive    = step === n && !success;
            const isCompleted = step > n;
            return (
              <div key={n} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="step-circle">
                  {isCompleted ? <i className="fas fa-check" /> : n}
                </div>
                <div className="step-label">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Step {step} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Form card */}
        <div className="form-card">

          {/* ── Step 1 ────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>👤 Your Details</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 28 }}>Please complete your profile information.</p>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number <span className="required">*</span></label>
                <input type="tel" id="phone" className={`form-control ${step1Errors.phone ? 'error' : ''}`}
                  placeholder="10-digit mobile number" maxLength={10}
                  value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                {step1Errors.phone && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{step1Errors.phone}</span></div>}
              </div>

              <div className="form-group">
                <label className="form-label">Gender <span className="required">*</span></label>
                <div className="radio-group">
                  {['Male', 'Female', 'Other'].map(g => (
                    <React.Fragment key={g}>
                      <input type="radio" name="gender" id={`gender${g}`} value={g} className="radio-option"
                        checked={gender === g} onChange={() => setGender(g)} />
                      <label className="radio-label" htmlFor={`gender${g}`}>
                        <i className={`fas fa-${g === 'Male' ? 'mars' : g === 'Female' ? 'venus' : 'genderless'}`} /> {g}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
                {step1Errors.gender && <div className="form-error show" style={{ marginTop: 8 }}><i className="fas fa-exclamation-circle" /> <span>{step1Errors.gender}</span></div>}
              </div>

              <div className="form-group">
                <label className="form-label">Languages Spoken <span className="required">*</span></label>
                <div className="checkbox-group">
                  {LANGUAGES.map(lang => (
                    <React.Fragment key={lang}>
                      <input type="checkbox" id={`lang${lang}`} value={lang} className="checkbox-option"
                        checked={languages.includes(lang)} onChange={() => toggleLanguage(lang)} />
                      <label className="checkbox-label" htmlFor={`lang${lang}`}>
                        {LANGUAGE_FLAGS[lang]} {lang}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
                {step1Errors.languages && <div className="form-error show" style={{ marginTop: 8 }}><i className="fas fa-exclamation-circle" /> <span>{step1Errors.languages}</span></div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button className="btn btn-ghost" onClick={() => navigate('/')}><i className="fas fa-arrow-left" /> Back to Home</button>
                <button className="btn btn-primary" onClick={handleNextStep} id="step1Next">Next: Rate Subjects <i className="fas fa-arrow-right" /></button>
              </div>
            </div>
          )}

          {/* ── Step 2 ────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>⭐ Subject Ratings</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>Rate each subject from 1 (poor) to 10 (excellent).</p>

              <div style={{
                background: 'hsl(251,75%,7%)', border: '1px solid hsl(251,75%,18%)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.85rem',
                color: 'var(--text-muted)', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <i className="fas fa-info-circle" style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                Click a number to select your rating. All 10 subjects must be rated.
              </div>

              <div id="ratingsContainer">
                {SUBJECTS.map(subj => (
                  <div
                    key={subj.key}
                    className={`rating-row ${errorSubjects.includes(subj.key) ? 'has-error' : ''}`}
                  >
                    <div className="rating-subject-name">
                      <span className="subj-icon">{subj.icon}</span>
                      {subj.label}
                      {ratings[subj.key] && (
                        <span className="rating-value-badge">{ratings[subj.key]}/10</span>
                      )}
                    </div>
                    <div className="rating-btns" id={`btns_${subj.key}`}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={`rating-btn ${ratings[subj.key] === n ? 'selected' : ''}`}
                          onClick={() => selectRating(subj.key, n)}
                          title={`Rate ${n}/10`}
                        >{n}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button className="btn btn-ghost" onClick={handlePrevStep}><i className="fas fa-arrow-left" /> Back</button>
                <button className="btn btn-primary" onClick={handleNextStep} id="step2Next">Review & Submit <i className="fas fa-arrow-right" /></button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ────────────────────────────────── */}
          {step === 3 && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 6 }}>📋 Review Your Submission</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 28 }}>Please review your details before submitting.</p>

              <div className="section-heading">Your Information</div>
              <div className="grid-2" style={{ marginBottom: 28 }}>
                {[
                  { label: 'Phone', value: phone },
                  { label: 'Gender', value: gender },
                  { label: 'Languages', value: languages.join(', ') },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '14px 18px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              <div className="section-heading">Subject Ratings</div>
              <div className="grid-2">
                {SUBJECTS.map(s => (
                  <div key={s.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 15px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.icon} {s.label}</span>
                    <span style={{
                      fontWeight: 700, color: 'var(--primary-light)',
                      background: 'hsl(251,75%,10%)', border: '1px solid hsl(251,75%,22%)',
                      borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.85rem',
                    }}>{ratings[s.key] || '—'}/10</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                <button className="btn btn-ghost" onClick={handlePrevStep}><i className="fas fa-arrow-left" /> Edit</button>
                <button
                  className={`btn btn-primary btn-lg ${submitting ? 'btn-loading' : ''}`}
                  onClick={handleSubmit} id="submitBtn" disabled={submitting}
                >
                  {!submitting && <i className="fas fa-paper-plane" />} {editMode ? 'Update Form' : 'Submit Form'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
