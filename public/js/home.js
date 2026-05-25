/**
 * home.js — Home page logic
 */

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setUserInitials();
  await loadHomeData();
  renderFormCards();
});

async function loadHomeData() {
  const user = Auth.getUser();
  if (!user) return;

  // Greeting
  const greetName = document.getElementById('greetingName');
  if (greetName) greetName.textContent = user.firstName || user.first_name || 'Student';

  // Member since
  const memberEl = document.getElementById('memberSince');

  // Try to get fresh form data
  try {
    const { form } = await FormsAPI.getMyForm();
    const formStatusStat  = document.getElementById('formStatusStat');
    const formStatusValue = document.getElementById('formStatusValue');
    const welcomeBanner   = document.getElementById('welcomeBanner');
    const mainFormBtn     = document.getElementById('mainFormBtn');

    if (form) {
      // Form submitted
      if (formStatusStat)  formStatusStat.innerHTML = '<i class="fas fa-check-circle"></i>';
      if (formStatusStat)  formStatusStat.className = 'stat-icon green';
      if (formStatusValue) formStatusValue.textContent = 'Submitted';
      if (welcomeBanner)   welcomeBanner.style.display = 'none';
      if (mainFormBtn) {
        mainFormBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Form';
        mainFormBtn.title = 'Edit your previously submitted form';
      }
      // Store form id for edit
      localStorage.setItem('crs_form_id', form.id);
    } else {
      if (welcomeBanner) welcomeBanner.style.display = 'flex';
      localStorage.removeItem('crs_form_id');
    }
  } catch (err) {
    console.error('Error loading form status:', err);
  }

  // Member since from auth data
  if (memberEl) {
    try {
      const meData = await AuthAPI.getMe();
      const createdAt = meData.user?.created_at;
      memberEl.textContent = createdAt
        ? new Date(createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : 'Today';
    } catch { memberEl.textContent = 'Recent'; }
  }

  // Greeting sub
  const sub = document.getElementById('greetingSub');
  if (sub) {
    const hour = new Date().getHours();
    const tod = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    sub.textContent = `Good ${tod}! Here are your available forms.`;
  }
}

function renderFormCards() {
  const grid = document.getElementById('formsGrid');
  if (!grid) return;

  const formId = localStorage.getItem('crs_form_id');
  const isSubmitted = !!formId;

  grid.innerHTML = `
    <div class="form-card" onclick="window.location.href='form.html'">
      ${isSubmitted ? '<div class="form-completed-ribbon">Done</div>' : ''}
      <div class="form-card-header">
        <div class="form-card-icon">📋</div>
        <div>
          ${isSubmitted
            ? '<span class="badge badge-success"><i class="fas fa-check"></i> Submitted</span>'
            : '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>'}
        </div>
      </div>
      <div>
        <div class="form-card-title">Subject Rating Form</div>
        <div class="form-card-desc">Rate 10 subjects from 1 to 10. Share personal info, gender, and languages spoken. Takes approximately 3 minutes.</div>
      </div>
      <div class="form-card-meta">
        <div class="form-deadline"><i class="fas fa-calendar"></i> Academic Year 2024-25</div>
        <div style="display:flex;gap:8px;">
          <span class="chip"><i class="fas fa-book"></i> 10 Subjects</span>
        </div>
      </div>
      <div class="form-card-footer">
        <button class="btn ${isSubmitted ? 'btn-secondary' : 'btn-primary'} btn-full" onclick="event.stopPropagation();window.location.href='form.html'">
          ${isSubmitted
            ? '<i class="fas fa-edit"></i> Edit Responses'
            : '<i class="fas fa-pen"></i> Fill Form'}
        </button>
      </div>
    </div>

    <div class="form-card" style="opacity:0.55;cursor:not-allowed;" title="Coming soon">
      <div class="form-card-icon" style="font-size:1.2rem;">🔒</div>
      <div>
        <div class="form-card-title">Faculty Feedback Form</div>
        <div class="form-card-desc">Rate individual faculty members on teaching effectiveness, communication, and subject knowledge.</div>
      </div>
      <div class="form-card-meta">
        <div class="form-deadline"><i class="fas fa-calendar"></i> Coming Soon</div>
      </div>
      <div class="form-card-footer">
        <button class="btn btn-ghost btn-full" disabled>
          <i class="fas fa-lock"></i> Locked
        </button>
      </div>
    </div>

    <div class="form-card" style="opacity:0.55;cursor:not-allowed;" title="Coming soon">
      <div class="form-card-icon" style="font-size:1.2rem;">🔒</div>
      <div>
        <div class="form-card-title">Infrastructure Feedback</div>
        <div class="form-card-desc">Evaluate college infrastructure — classrooms, labs, library, canteen, and sports facilities.</div>
      </div>
      <div class="form-card-meta">
        <div class="form-deadline"><i class="fas fa-calendar"></i> Coming Soon</div>
      </div>
      <div class="form-card-footer">
        <button class="btn btn-ghost btn-full" disabled>
          <i class="fas fa-lock"></i> Locked
        </button>
      </div>
    </div>
  `;
}
