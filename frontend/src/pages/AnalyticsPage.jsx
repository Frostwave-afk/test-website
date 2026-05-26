import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut, Radar, Line, PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend,
} from 'chart.js';
import Navbar from '../components/Navbar';
import { AnalyticsAPI, formatMonth } from '../api/client';
import { useToast } from '../context/ToastContext';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
);

// Update defaults
ChartJS.defaults.color = '#94A3B8';
ChartJS.defaults.font.family = "'Inter', sans-serif";

const SUBJECT_LABELS = ['English','Hindi','Biology','Physics','Chemistry','Mathematics','History','Geography','Comp.Sci.','Economics'];
const SUBJECT_KEYS   = ['english','hindi','biology','physics','chemistry','mathematics','history','geography','computer_science','economics'];
const FULL_LABELS    = ['English','Hindi','Biology','Physics','Chemistry','Mathematics','History','Geography','Computer Science','Economics'];

const PALETTE = {
  purple: 'rgba(139,92,246,0.85)',  purpleL: 'rgba(139,92,246,0.18)',
  teal:   'rgba(45,212,191,0.85)',  tealL:   'rgba(45,212,191,0.18)',
  pink:   'rgba(236,72,153,0.85)',  pinkL:   'rgba(236,72,153,0.18)',
  green:  'rgba(52,211,153,0.85)',  greenL:  'rgba(52,211,153,0.18)',
  amber:  'rgba(251,191,36,0.85)',  amberL:  'rgba(251,191,36,0.18)',
};

const GENDER_COLORS = {
  Male:   { solid: 'rgba(45,212,191,0.82)',  light: 'rgba(45,212,191,0.15)' },
  Female: { solid: 'rgba(236,72,153,0.82)',  light: 'rgba(236,72,153,0.15)' },
  Other:  { solid: 'rgba(251,191,36,0.82)',  light: 'rgba(251,191,36,0.15)' },
};

const MULTI_COLORS = [
  'rgba(139,92,246,0.82)','rgba(45,212,191,0.82)','rgba(236,72,153,0.82)',
  'rgba(52,211,153,0.82)','rgba(251,191,36,0.82)','rgba(239,68,68,0.82)',
  'rgba(99,102,241,0.82)','rgba(20,184,166,0.82)',
];

const CHART_OPTS = (overrides = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  ...overrides,
});

const GRID_OPTS = { y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 2 } }, x: { grid: { display: false } } };

export default function AnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => { loadAnalytics(); }, []);

  async function loadAnalytics() {
    setSpinning(true);
    try {
      const d = await AnalyticsAPI.getSummary();
      setData(d);
    } catch (err) {
      showToast('Failed to load analytics: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }

  const subjectVals = SUBJECT_KEYS.map(k => parseFloat(data?.subjectAvg?.[k]) || 0);
  const overallAvg = (() => {
    const vals = subjectVals.filter(v => v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  })();

  const genderDatasets = (data?.genderAvg || []).map(row => ({
    label: row.gender,
    data: SUBJECT_KEYS.map(k => parseFloat(row[k]) || 0),
    backgroundColor: GENDER_COLORS[row.gender]?.solid || 'rgba(99,102,241,0.82)',
    borderRadius: 5,
    borderSkipped: false,
  }));

  const genderDist  = data?.genderDist  || [];
  const langDist    = (data?.languageDist || []).sort((a, b) => b.count - a.count).slice(0, 8);
  const monthlyTrend = data?.monthlyTrend || [];

  const ranked = SUBJECT_KEYS.map((k, i) => ({ name: FULL_LABELS[i], avg: parseFloat(data?.subjectAvg?.[k]) || 0 }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="page-wrapper">
      <Navbar isAdmin />
      <div className="container" style={{ paddingTop: 36, paddingBottom: 72 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Analytics Dashboard</h1>
            <p className="page-subtitle">Subject ratings, gender analysis & submission trends</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition)',
              }}
              onClick={loadAnalytics}
              title="Refresh"
              id="refreshBtn"
            >
              <i className={`fas fa-sync-alt ${spinning ? 'fa-spin' : ''}`} />
            </button>
            <Link to="/admin" className="btn btn-ghost btn-sm"><i className="fas fa-arrow-left" /> Dashboard</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { icon: 'fa-users',          color: 'purple', label: 'Total Students',   value: data?.overview?.total_students    ?? '—' },
            { icon: 'fa-clipboard-check',color: 'teal',   label: 'Submissions',      value: data?.overview?.total_submissions ?? '—' },
            { icon: 'fa-star',           color: 'green',  label: 'Overall Avg Rating',value: overallAvg },
            { icon: 'fa-user-plus',      color: 'pink',   label: 'New Today',        value: data?.overview?.new_today         ?? '—' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`} /></div>
              <div className="stat-info">
                <div className="stat-value" id={`aStat${s.label.replace(/\s/g,'')}`}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="empty-state"><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} /><p>Loading analytics…</p></div>
        ) : (
          <div className="chart-grid">

            {/* 1. Subject avg bar */}
            <div className="chart-card full">
              <ChartHeader title="📚 Average Rating by Subject" subtitle="Mean rating (1–10) across all submissions" badge="Bar Chart" badgeIcon="fa-chart-bar" />
              <div style={{ height: 280 }}>
                <Bar
                  data={{
                    labels: SUBJECT_LABELS,
                    datasets: [{
                      label: 'Average Rating',
                      data: subjectVals,
                      backgroundColor: subjectVals.map((_, i) => i % 2 === 0 ? PALETTE.purple : PALETTE.teal),
                      borderRadius: 8, borderSkipped: false,
                    }]
                  }}
                  options={CHART_OPTS({ scales: GRID_OPTS, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` Rating: ${c.parsed.y.toFixed(1)} / 10` } } } })}
                />
              </div>
            </div>

            {/* 2. Gender comparison */}
            <div className="chart-card full">
              <ChartHeader title="👥 Gender-Based Subject Rating Comparison" subtitle="Average rating per subject split by gender" badge="Comparison" badgeIcon="fa-venus-mars" />
              {data?.genderAvg?.length > 0 && (
                <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                  {data.genderAvg.map(r => (
                    <div key={r.gender} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: GENDER_COLORS[r.gender]?.solid || '#6366f1' }} />
                      {r.gender} ({r.count} students)
                    </div>
                  ))}
                </div>
              )}
              <div style={{ height: 300 }}>
                {genderDatasets.length > 0
                  ? <Bar data={{ labels: SUBJECT_LABELS, datasets: genderDatasets }} options={CHART_OPTS({ scales: GRID_OPTS, plugins: { legend: { display: false } } })} />
                  : <NoData msg="No gender data yet" />}
              </div>
            </div>

            {/* 3. Gender distribution doughnut */}
            <div className="chart-card">
              <ChartHeader title="🍩 Gender Distribution" subtitle="Proportion of male, female, other respondents" badge="Doughnut" badgeIcon="fa-circle" />
              <div style={{ height: 250 }}>
                {genderDist.length > 0
                  ? <Doughnut
                      data={{
                        labels: genderDist.map(r => r.gender),
                        datasets: [{
                          data: genderDist.map(r => r.count),
                          backgroundColor: genderDist.map(r => GENDER_COLORS[r.gender]?.solid || '#6366f1'),
                          borderColor: 'hsl(228,22%,9%)', borderWidth: 3, hoverOffset: 8,
                        }]
                      }}
                      options={CHART_OPTS({ cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed} students` } } } })}
                    />
                  : <NoData msg="No submissions yet" />}
              </div>
            </div>

            {/* 4. Language distribution polar */}
            <div className="chart-card">
              <ChartHeader title="🌐 Language Distribution" subtitle="Languages spoken by students" badge="Polar Area" badgeIcon="fa-language" />
              <div style={{ height: 250 }}>
                {langDist.length > 0
                  ? <PolarArea
                      data={{
                        labels: langDist.map(r => r.language),
                        datasets: [{ data: langDist.map(r => r.count), backgroundColor: MULTI_COLORS.slice(0, langDist.length), borderColor: 'hsl(228,22%,9%)', borderWidth: 2 }]
                      }}
                      options={CHART_OPTS({ plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } }, scales: { r: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { display: false } } } })}
                    />
                  : <NoData msg="No language data yet" />}
              </div>
            </div>

            {/* 5. Radar */}
            <div className="chart-card">
              <ChartHeader title="🕸️ Subject Rating Profile" subtitle="Overall strength across all subjects" badge="Radar" badgeIcon="fa-spider" />
              <div style={{ height: 270 }}>
                <Radar
                  data={{
                    labels: SUBJECT_LABELS,
                    datasets: [{
                      label: 'Average Rating', data: subjectVals,
                      backgroundColor: PALETTE.purpleL, borderColor: PALETTE.purple,
                      pointBackgroundColor: PALETTE.purple, pointBorderColor: '#fff', pointRadius: 4, borderWidth: 2,
                    }]
                  }}
                  options={CHART_OPTS({ plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, backdropColor: 'transparent' }, grid: { color: 'rgba(255,255,255,0.08)' }, angleLines: { color: 'rgba(255,255,255,0.06)' }, pointLabels: { font: { size: 10 } } } } })}
                />
              </div>
            </div>

            {/* 6. Trend line */}
            <div className="chart-card">
              <ChartHeader title="📈 Submission Trend" subtitle="Monthly form submissions over time" badge="Line Chart" badgeIcon="fa-chart-line" />
              <div style={{ height: 270 }}>
                {monthlyTrend.length > 0
                  ? <Line
                      data={{
                        labels: monthlyTrend.map(r => formatMonth(r.month)),
                        datasets: [{
                          label: 'Submissions', data: monthlyTrend.map(r => r.count),
                          backgroundColor: PALETTE.purpleL, borderColor: PALETTE.purple,
                          pointBackgroundColor: PALETTE.purple, pointBorderColor: '#fff', pointRadius: 5,
                          borderWidth: 2.5, fill: true, tension: 0.4,
                        }]
                      }}
                      options={CHART_OPTS({ plugins: { legend: { display: false } }, scales: { y: { min: 0, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } } })}
                    />
                  : <NoData msg="No submission data yet" />}
              </div>
            </div>

            {/* 7. Rankings */}
            <div className="chart-card full">
              <ChartHeader title="🏆 Subject Rankings" subtitle="Subjects ranked by average rating (highest to lowest)" badge="Rankings" badgeIcon="fa-trophy" />
              <div className="rankings-grid">
                {[ranked.slice(0, 5), ranked.slice(5)].map((half, idx) => (
                  <ul key={idx} style={{ listStyle: 'none' }}>
                    {half.map((item, i) => {
                      const rank = idx * 5 + i + 1;
                      const posClass = rank === 1 ? { bg: 'rgba(245,158,11,0.2)', color: '#FDE68A' }
                        : rank === 2 ? { bg: 'rgba(148,163,184,0.2)', color: '#CBD5E1' }
                        : rank === 3 ? { bg: 'rgba(180,83,9,0.2)', color: '#FCD34D' }
                        : { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' };
                      const barW = item.avg > 0 ? Math.round((item.avg / 10) * 100) : 0;
                      return (
                        <li key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, background: posClass.bg, color: posClass.color }}>
                            {rank}
                          </div>
                          <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.name}</div>
                          <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${barW}%`, height: '100%', background: 'var(--gradient-brand)', borderRadius: 99 }} />
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'var(--font-display)', fontSize: '1rem', minWidth: 36, textAlign: 'right' }}>
                            {item.avg > 0 ? item.avg.toFixed(1) : '—'}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function ChartHeader({ title, subtitle, badge, badgeIcon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
      <div>
        <div className="chart-card-title">{title}</div>
        <div className="chart-card-subtitle">{subtitle}</div>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
        background: 'hsl(251,75%,10%)', border: '1px solid hsl(251,75%,20%)',
        borderRadius: 'var(--radius-full)', fontSize: '0.72rem', color: 'var(--primary-light)',
        fontWeight: 600, flexShrink: 0,
      }}>
        <i className={`fas ${badgeIcon}`} /> {badge}
      </div>
    </div>
  );
}

function NoData({ msg }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
      <i className="fas fa-chart-bar" style={{ fontSize: '2rem', opacity: 0.3 }} />
      <p style={{ fontSize: '0.875rem' }}>{msg}</p>
    </div>
  );
}
