/**
 * analytics.js — Analytics dashboard with Chart.js
 */

const SUBJECT_LABELS = ['English', 'Hindi', 'Biology', 'Physics', 'Chemistry', 'Mathematics', 'History', 'Geography', 'Comp. Sci.', 'Economics'];
const SUBJECT_KEYS   = ['english', 'hindi', 'biology', 'physics', 'chemistry', 'mathematics', 'history', 'geography', 'computer_science', 'economics'];

// Chart defaults
Chart.defaults.color = '#94A3B8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size   = 12;

const PALETTE = {
  purple:  'rgba(124, 58, 237, 0.85)',
  purpleL: 'rgba(124, 58, 237, 0.2)',
  cyan:    'rgba(6, 182, 212, 0.85)',
  cyanL:   'rgba(6, 182, 212, 0.2)',
  pink:    'rgba(236, 72, 153, 0.85)',
  pinkL:   'rgba(236, 72, 153, 0.2)',
  green:   'rgba(16, 185, 129, 0.85)',
  greenL:  'rgba(16, 185, 129, 0.2)',
  amber:   'rgba(245, 158, 11, 0.85)',
  amberL:  'rgba(245, 158, 11, 0.2)',
};

const GENDER_COLORS = {
  Male:   { solid: 'rgba(6, 182, 212, 0.8)',   light: 'rgba(6, 182, 212, 0.15)' },
  Female: { solid: 'rgba(236, 72, 153, 0.8)',  light: 'rgba(236, 72, 153, 0.15)' },
  Other:  { solid: 'rgba(245, 158, 11, 0.8)',  light: 'rgba(245, 158, 11, 0.15)' },
};

const MULTI_COLORS = [
  'rgba(124,58,237,0.8)', 'rgba(6,182,212,0.8)', 'rgba(236,72,153,0.8)',
  'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)',
  'rgba(99,102,241,0.8)', 'rgba(20,184,166,0.8)'
];

let charts = {};

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAdmin()) return;
  setUserInitials();
  await loadAnalytics();
});

async function loadAnalytics() {
  const btn = document.getElementById('refreshBtn');
  if (btn) btn.classList.add('spinning');

  try {
    const data = await AnalyticsAPI.getSummary();
    updateOverviewStats(data);
    renderSubjectAvgChart(data.subjectAvg);
    renderGenderCompChart(data.genderAvg);
    renderGenderDistChart(data.genderDist);
    renderLanguageChart(data.languageDist);
    renderRadarChart(data.subjectAvg);
    renderTrendChart(data.monthlyTrend);
    renderRankings(data.subjectAvg);
  } catch (err) {
    showToast('Failed to load analytics: ' + err.message, 'error');
  } finally {
    if (btn) btn.classList.remove('spinning');
  }
}

function updateOverviewStats(data) {
  const { overview, subjectAvg } = data;
  setElText('aStatStudents',    overview?.total_students  ?? '—');
  setElText('aStatSubmissions', overview?.total_submissions ?? '—');
  setElText('aStatToday',       overview?.new_today ?? '—');

  // Overall avg
  if (subjectAvg) {
    const vals = SUBJECT_KEYS.map(k => parseFloat(subjectAvg[k]) || 0).filter(v => v > 0);
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
    setElText('aStatAvgRating', avg);
  }
}

// ── 1. Subject avg — Bar chart ────────────────────────────────────────────────
function renderSubjectAvgChart(subjectAvg) {
  const ctx = document.getElementById('subjectAvgChart');
  if (!ctx) return;
  if (charts.subjectAvg) charts.subjectAvg.destroy();

  const vals = SUBJECT_KEYS.map(k => parseFloat(subjectAvg?.[k]) || 0);

  charts.subjectAvg = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: SUBJECT_LABELS,
      datasets: [{
        label: 'Average Rating',
        data: vals,
        backgroundColor: vals.map((v, i) =>
          i % 2 === 0 ? PALETTE.purple : PALETTE.cyan
        ),
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Rating: ${ctx.parsed.y.toFixed(1)} / 10`
          }
        }
      },
      scales: {
        y: {
          min: 0, max: 10,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { stepSize: 2 }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── 2. Gender comparison — Grouped bar ───────────────────────────────────────
function renderGenderCompChart(genderAvg) {
  const ctx = document.getElementById('genderCompChart');
  if (!ctx) return;
  if (charts.genderComp) charts.genderComp.destroy();

  if (!genderAvg || genderAvg.length === 0) {
    showNoData(ctx, 'No gender data yet');
    return;
  }

  const datasets = genderAvg.map(row => ({
    label: row.gender,
    data: SUBJECT_KEYS.map(k => parseFloat(row[k]) || 0),
    backgroundColor: GENDER_COLORS[row.gender]?.solid || 'rgba(99,102,241,0.8)',
    borderRadius: 6,
    borderSkipped: false,
  }));

  // Render legend
  const legend = document.getElementById('genderLegend');
  if (legend) {
    legend.innerHTML = genderAvg.map(r => `
      <div class="gender-legend-item">
        <div class="gender-legend-dot" style="background:${GENDER_COLORS[r.gender]?.solid || '#6366f1'}"></div>
        ${r.gender} (${r.count} students)
      </div>
    `).join('');
  }

  charts.genderComp = new Chart(ctx, {
    type: 'bar',
    data: { labels: SUBJECT_LABELS, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 10,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { stepSize: 2 }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── 3. Gender distribution — Doughnut ────────────────────────────────────────
function renderGenderDistChart(genderDist) {
  const ctx = document.getElementById('genderDistChart');
  if (!ctx) return;
  if (charts.genderDist) charts.genderDist.destroy();

  if (!genderDist || genderDist.length === 0) {
    showNoData(ctx, 'No submissions yet');
    return;
  }

  charts.genderDist = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: genderDist.map(r => r.gender),
      datasets: [{
        data: genderDist.map(r => r.count),
        backgroundColor: genderDist.map(r => GENDER_COLORS[r.gender]?.solid || '#6366f1'),
        hoverBackgroundColor: genderDist.map(r => GENDER_COLORS[r.gender]?.solid || '#6366f1'),
        borderColor: 'var(--bg-surface)',
        borderWidth: 3,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} students`
          }
        }
      }
    }
  });
}

// ── 4. Language distribution — Polar Area ────────────────────────────────────
function renderLanguageChart(languageDist) {
  const ctx = document.getElementById('languageChart');
  if (!ctx) return;
  if (charts.language) charts.language.destroy();

  if (!languageDist || languageDist.length === 0) {
    showNoData(ctx, 'No language data yet');
    return;
  }

  const sorted = [...languageDist].sort((a, b) => b.count - a.count).slice(0, 8);

  charts.language = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: sorted.map(r => r.language),
      datasets: [{
        data: sorted.map(r => r.count),
        backgroundColor: MULTI_COLORS.slice(0, sorted.length),
        borderColor: 'var(--bg-surface)',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12, usePointStyle: true }
        }
      },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { display: false }
        }
      }
    }
  });
}

// ── 5. Radar chart ────────────────────────────────────────────────────────────
function renderRadarChart(subjectAvg) {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;
  if (charts.radar) charts.radar.destroy();

  const vals = SUBJECT_KEYS.map(k => parseFloat(subjectAvg?.[k]) || 0);

  charts.radar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: SUBJECT_LABELS,
      datasets: [{
        label: 'Average Rating',
        data: vals,
        backgroundColor: PALETTE.purpleL,
        borderColor: PALETTE.purple,
        pointBackgroundColor: PALETTE.purple,
        pointBorderColor: '#fff',
        pointRadius: 4,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 10,
          ticks: { stepSize: 2, backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.08)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { font: { size: 11 } }
        }
      }
    }
  });
}

// ── 6. Monthly trend — Line chart ─────────────────────────────────────────────
function renderTrendChart(monthlyTrend) {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;
  if (charts.trend) charts.trend.destroy();

  if (!monthlyTrend || monthlyTrend.length === 0) {
    showNoData(ctx, 'No submission data yet');
    return;
  }

  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyTrend.map(r => formatMonth(r.month)),
      datasets: [{
        label: 'Submissions',
        data: monthlyTrend.map(r => r.count),
        backgroundColor: PALETTE.purpleL,
        borderColor: PALETTE.purple,
        pointBackgroundColor: PALETTE.purple,
        pointBorderColor: '#fff',
        pointRadius: 5,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { precision: 0 }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── 7. Subject rankings ───────────────────────────────────────────────────────
function renderRankings(subjectAvg) {
  const list1 = document.getElementById('rankingList1');
  const list2 = document.getElementById('rankingList2');
  if (!list1 || !list2) return;

  const FULL_LABELS = ['English', 'Hindi', 'Biology', 'Physics', 'Chemistry', 'Mathematics', 'History', 'Geography', 'Computer Science', 'Economics'];

  const ranked = SUBJECT_KEYS.map((k, i) => ({
    name: FULL_LABELS[i],
    avg:  parseFloat(subjectAvg?.[k]) || 0
  })).sort((a, b) => b.avg - a.avg);

  const half1 = ranked.slice(0, 5);
  const half2 = ranked.slice(5, 10);
  const maxAvg = ranked[0]?.avg || 10;

  function renderItem(item, rank) {
    const posClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'other';
    const barWidth = maxAvg > 0 ? Math.round((item.avg / 10) * 100) : 0;
    return `
      <li class="ranking-item">
        <div class="ranking-pos ${posClass}">${rank}</div>
        <div class="ranking-name">${item.name}</div>
        <div class="ranking-bar-wrap">
          <div class="ranking-bar" style="width:${barWidth}%"></div>
        </div>
        <div class="ranking-score">${item.avg > 0 ? item.avg.toFixed(1) : '—'}</div>
      </li>
    `;
  }

  list1.innerHTML = half1.map((item, i) => renderItem(item, i + 1)).join('');
  list2.innerHTML = half2.map((item, i) => renderItem(item, i + 6)).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function showNoData(ctx, msg) {
  // Replace canvas with message
  const parent = ctx.parentElement;
  parent.innerHTML = `<div class="no-data"><i class="fas fa-chart-bar"></i><p>${msg}</p></div>`;
}

function setElText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
