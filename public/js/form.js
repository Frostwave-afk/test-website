/**
 * form.js — Multi-step subject rating form logic
 */

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

let currentStep = 1;
let totalSteps  = 3;
let existingFormId = null;
let ratings = {};

// ── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setUserInitials();
  buildRatingUI();
  await loadExistingForm();
});

// ── Build rating number buttons ───────────────────────────────────────────────
function buildRatingUI() {
  const container = document.getElementById('ratingsContainer');
  if (!container) return;

  container.innerHTML = SUBJECTS.map(subj => `
    <div class="rating-row" id="ratingRow_${subj.key}">
      <div class="rating-subject-name">
        <div class="subj-icon">${subj.icon}</div>
        ${subj.label}
        <span class="rating-value-badge" id="badge_${subj.key}">—</span>
      </div>
      <div class="rating-btns" id="btns_${subj.key}">
        ${[1,2,3,4,5,6,7,8,9,10].map(n =>
          `<button type="button" class="rating-btn" data-subject="${subj.key}" data-value="${n}"
            onclick="selectRating('${subj.key}', ${n})" title="Rate ${n}/10">${n}</button>`
        ).join('')}
      </div>
    </div>
  `).join('');
}

function selectRating(subjectKey, value) {
  ratings[subjectKey] = value;

  // Update button states
  const btns = document.querySelectorAll(`#btns_${subjectKey} .rating-btn`);
  btns.forEach(btn => {
    const v = parseInt(btn.dataset.value);
    btn.classList.toggle('selected', v === value);
  });

  // Update badge
  const badge = document.getElementById(`badge_${subjectKey}`);
  if (badge) badge.textContent = value + '/10';

  // Remove error styling from row
  const row = document.getElementById(`ratingRow_${subjectKey}`);
  if (row) row.style.outline = '';
}

// ── Load existing form data (edit mode) ──────────────────────────────────────
async function loadExistingForm() {
  try {
    const { form } = await FormsAPI.getMyForm();
    if (!form) return;

    existingFormId = form.id;

    // Show edit mode badge
    document.getElementById('editModeBadge').style.display = 'block';
    document.getElementById('formModeLabel').textContent = 'Edit your previous submission';

    // Prefill form data
    setVal('phone', form.phone || '');

    // Gender
    if (form.gender) {
      const radio = document.querySelector(`input[name="gender"][value="${form.gender}"]`);
      if (radio) radio.checked = true;
    }

    // Languages
    let langs = form.languages;
    if (typeof langs === 'string') { try { langs = JSON.parse(langs); } catch { langs = []; } }
    if (Array.isArray(langs)) {
      langs.forEach(lang => {
        const cb = document.querySelector(`input[type="checkbox"][value="${lang}"]`);
        if (cb) cb.checked = true;
      });
    }

    // Ratings
    SUBJECTS.forEach(subj => {
      const val = form[subj.key];
      if (val) selectRating(subj.key, parseInt(val));
    });

  } catch (err) {
    // No existing form — first-time submission
    // Form starts empty, user fills it in
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ── Step navigation ───────────────────────────────────────────────────────────
function nextStep() {
  if (currentStep === 1 && !validateStep1()) return;
  if (currentStep === 2 && !validateStep2()) return;
  if (currentStep === 3) { submitForm(); return; }

  setStep(currentStep + 1);
  if (currentStep === 3) buildReview();
}

function prevStep() {
  if (currentStep > 1) setStep(currentStep - 1);
}

function setStep(n) {
  // Hide current step
  document.getElementById(`step${currentStep}`).classList.remove('active');
  document.getElementById(`stepItem${currentStep}`).classList.remove('active');
  document.getElementById(`stepItem${currentStep}`).classList.add('completed');
  document.getElementById(`stepCircle${currentStep}`).innerHTML = '<i class="fas fa-check"></i>';

  currentStep = n;

  // Show new step
  document.getElementById(`step${currentStep}`).classList.add('active');
  document.getElementById(`stepItem${currentStep}`).classList.remove('completed');
  document.getElementById(`stepItem${currentStep}`).classList.add('active');
  document.getElementById(`stepCircle${currentStep}`).textContent = currentStep;

  // Update progress
  const pct = Math.round(((currentStep - 1) / totalSteps) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressLabel').textContent = `Step ${currentStep} of ${totalSteps}`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Step 1 Validation ─────────────────────────────────────────────────────────
function validateStep1() {
  let valid = true;
  clearFormErrors();

  const phone     = document.getElementById('phone').value.trim();
  const gender    = document.querySelector('input[name="gender"]:checked');
  const languages = document.querySelectorAll('input[type="checkbox"]:checked');

  if (!phone) {
    showFormError('phoneError', 'Phone number is required.'); valid = false;
  } else if (!/^\d{10}$/.test(phone)) {
    showFormError('phoneError', 'Phone must be exactly 10 digits, no spaces or dashes.'); valid = false;
  }

  if (!gender)          { showFormError('genderError',    'Please select your gender.'); valid = false; }
  if (languages.length === 0) { showFormError('languagesError', 'Please select at least one language.'); valid = false; }

  return valid;
}

// ── Step 2 Validation ─────────────────────────────────────────────────────────
function validateStep2() {
  let valid = true;
  const unrated = SUBJECTS.filter(s => !ratings[s.key]);
  if (unrated.length > 0) {
    showToast(`Please rate all subjects. Missing: ${unrated.map(s => s.label).join(', ')}`, 'error', 5000);
    // Highlight missing rows
    unrated.forEach(s => {
      const row = document.getElementById(`ratingRow_${s.key}`);
      if (row) row.style.outline = '2px solid var(--error)';
    });
    valid = false;
  }
  return valid;
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelector('span').textContent = msg;
  el.classList.add('show');
  const inputId = id.replace('Error', '');
  const input = document.getElementById(inputId);
  if (input) input.classList.add('error');
}
function clearFormErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.form-control').forEach(e => e.classList.remove('error'));
}

// ── Build review screen ───────────────────────────────────────────────────────
function buildReview() {
  const gender    = document.querySelector('input[name="gender"]:checked')?.value || '—';
  const languages = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
  const phone     = document.getElementById('phone').value;

  // Personal info
  document.getElementById('reviewPersonal').innerHTML = `
    <div class="review-item"><div class="review-item-label">Phone</div><div class="review-item-value">${phone}</div></div>
    <div class="review-item"><div class="review-item-label">Gender</div><div class="review-item-value">${gender}</div></div>
    <div class="review-item"><div class="review-item-label">Languages</div><div class="review-item-value">${languages.join(', ')}</div></div>
  `;

  // Ratings
  document.getElementById('reviewRatings').innerHTML = SUBJECTS.map(s => `
    <div class="ratings-review-item">
      <span class="ratings-review-subj">${s.icon} ${s.label}</span>
      <span class="ratings-review-score">${ratings[s.key] || '—'}/10</span>
    </div>
  `).join('');
}

// ── Submit form ───────────────────────────────────────────────────────────────
async function submitForm() {
  const languages = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
  const gender    = document.querySelector('input[name="gender"]:checked')?.value;
  const phone     = document.getElementById('phone').value.trim();

  const payload = {
    phone,
    gender,
    languages,
    ...Object.fromEntries(SUBJECTS.map(s => [s.key, ratings[s.key]]))
  };

  const btn = document.getElementById('submitBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    if (existingFormId) {
      await FormsAPI.update(existingFormId, payload);
      showToast('Form updated successfully!', 'success');
    } else {
      const result = await FormsAPI.submit(payload);
      existingFormId = result.formId;
      localStorage.setItem('crs_form_id', existingFormId);
      showToast('Form submitted successfully!', 'success');
    }

    // Show success screen
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById('stepSuccess').classList.add('active');
    document.getElementById('stepIndicator').style.display = 'none';
    document.querySelector('.form-progress').style.display = 'none';

  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

function editForm() {
  currentStep = 1;
  document.getElementById('stepSuccess').classList.remove('active');
  document.getElementById('step1').classList.add('active');
  document.getElementById('stepIndicator').style.display = 'flex';
  document.querySelector('.form-progress').style.display = 'block';
  // Reset step indicators
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`stepItem${i}`).classList.remove('active', 'completed');
    document.getElementById(`stepCircle${i}`).textContent = i;
  }
  document.getElementById('stepItem1').classList.add('active');
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressPct').textContent = '0%';
  document.getElementById('progressLabel').textContent = 'Step 1 of 3';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Phone: only allow digits
document.getElementById('phone')?.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 10);
});
