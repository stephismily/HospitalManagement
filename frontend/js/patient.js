const token = localStorage.getItem('token');
const API_BASE = window.location.port === '5000' ? window.location.origin : 'http://localhost:5000';

const profileEl = document.getElementById('profile');
const slotsListEl = document.getElementById('slotsList');
const appointmentsListEl = document.getElementById('appointmentsList');
const messageEl = document.getElementById('patientMessage');
const resetBtn = document.getElementById('resetBtn');
const logoutBtn = document.getElementById('logoutBtn');
const slotSearchForm = document.getElementById('slotSearchForm');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const doctorNameEl = document.getElementById('doctorName');
const slotDateEl = document.getElementById('slotDate');
const specializationEl = document.getElementById('specialization');

if (!token || localStorage.getItem('role') !== 'patient') {
  window.location.href = 'index.html';
}

const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString();
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const buildThirtyMinuteOptions = (slot) => {
  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);
  const options = [];

  for (let time = start; time + 30 <= end; time += 30) {
    const optionStart = formatMinutes(time);
    const optionEnd = formatMinutes(time + 30);
    options.push({ startTime: optionStart, endTime: optionEnd });
  }

  return options;
};

const escapeHtml = (value) => {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const showMessage = (message, type = 'danger') => {
  messageEl.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
};

const clearMessage = () => {
  messageEl.innerHTML = '';
};

const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || body.message || 'Request failed');
  }

  return body.data;
};

const renderProfile = (patient) => {
  profileEl.innerHTML = `
    <div><strong>Name:</strong> ${escapeHtml(patient.patientName || 'Not set')}</div>
    <div><strong>Email:</strong> ${escapeHtml(patient.email || 'Not set')}</div>
    <div><strong>Contact:</strong> ${escapeHtml(patient.contact || 'Not set')}</div>
    <div><strong>Date of Birth:</strong> ${escapeHtml(formatDate(patient.dob))}</div>
    <div><strong>Address:</strong> ${escapeHtml(patient.address || 'Not set')}</div>
  `;
};

const getDoctor = (slot) => slot.doctorId || {};

const renderSlots = (slots) => {
  if (!slots.length) {
    slotsListEl.innerHTML = '<div class="col-12"><div class="alert alert-info">No available slots found.</div></div>';
    return;
  }

  slotsListEl.innerHTML = slots.map((slot) => {
    const doctor = getDoctor(slot);
    const disabled = slot.isAvailable ? '' : 'disabled';
    const buttonText = slot.isAvailable ? 'Book Appointment' : 'Already Booked';
    const timeOptions = buildThirtyMinuteOptions(slot);

    return `
      <div class="col-md-6">
        <div class="border rounded p-3 bg-white h-100" data-slot-card="${escapeHtml(slot._id)}">
          <div><strong>Doctor:</strong> ${escapeHtml(doctor.doctorName || 'Doctor')}</div>
          <div><strong>Specialization:</strong> ${escapeHtml(doctor.specialization || 'Not set')}</div>
          <div><strong>Date:</strong> ${escapeHtml(formatDate(slot.date))}</div>
          <div><strong>Time:</strong> ${escapeHtml(slot.startTime || 'Not set')} - ${escapeHtml(slot.endTime || 'Not set')}</div>
          <div><strong>Status:</strong> ${slot.isAvailable ? 'Available' : 'Booked'}</div>
          <label class="form-label mt-3" for="slotTime-${escapeHtml(slot._id)}">Select Time</label>
          <select class="form-select slot-time-select" id="slotTime-${escapeHtml(slot._id)}" ${disabled}>
            ${timeOptions.map((option) => `
              <option value="${option.startTime}|${option.endTime}">
                ${option.startTime} - ${option.endTime}
              </option>
            `).join('')}
          </select>
          <button class="btn btn-primary mt-3 book-slot-btn" data-slot-id="${escapeHtml(slot._id)}" ${disabled || !timeOptions.length ? 'disabled' : ''}>${buttonText}</button>
        </div>
      </div>
    `;
  }).join('');
};

const renderAppointments = (appointments) => {
  const visibleAppointments = appointments.filter((appointment) => appointment.status !== 'completed');

  if (!visibleAppointments.length) {
    appointmentsListEl.innerHTML = '<div class="col-12"><div class="alert alert-info">No appointments found.</div></div>';
    return;
  }

  appointmentsListEl.innerHTML = visibleAppointments.map((appointment) => {
    const doctor = appointment.doctorId || {};
    const slot = appointment.slotId || {};

    return `
      <div class="col-md-6">
        <div class="border rounded p-3 bg-white h-100">
          <div><strong>Doctor:</strong> ${escapeHtml(doctor.doctorName || 'Doctor')}</div>
          <div><strong>Specialization:</strong> ${escapeHtml(doctor.specialization || 'Not set')}</div>
          <div><strong>Date:</strong> ${escapeHtml(formatDate(slot.date))}</div>
          <div><strong>Time:</strong> ${escapeHtml(slot.startTime || 'Not set')} - ${escapeHtml(slot.endTime || 'Not set')}</div>
          <div><strong>Status:</strong> ${escapeHtml(appointment.status || 'Not set')}</div>
          ${appointment.doctorNotes ? `<div><strong>Doctor Notes:</strong> ${escapeHtml(appointment.doctorNotes)}</div>` : ''}
          ${appointment.cancelReason ? `<div><strong>Cancel Reason:</strong> ${escapeHtml(appointment.cancelReason)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
};

const getSearchParams = () => {
  const params = new URLSearchParams({ isAvailable: 'true' });

  if (doctorNameEl.value.trim()) params.set('doctorName', doctorNameEl.value.trim());
  if (slotDateEl.value) params.set('date', slotDateEl.value);
  if (specializationEl.value.trim()) params.set('specialization', specializationEl.value.trim());

  return params;
};

const loadProfile = async () => {
  const profile = await apiFetch('/api/patients/me');
  renderProfile(profile);
};

const loadAppointments = async () => {
  const appointments = await apiFetch('/api/patients/me/appointments');
  renderAppointments(appointments);
};

const searchSlots = async () => {
  const params = getSearchParams();
  const slots = await apiFetch(`/api/slots?${params.toString()}`);
  renderSlots(slots);
};

const loadDashboard = async () => {
  clearMessage();
  profileEl.textContent = 'Loading profile...';
  slotsListEl.textContent = 'Loading available slots...';
  appointmentsListEl.textContent = 'Loading appointments...';

  try {
    await Promise.all([
      loadProfile(),
      searchSlots(),
      loadAppointments()
    ]);
  } catch (err) {
    showMessage(err.message || 'Unable to load patient dashboard.');
  }
};

const bookSlot = async (slotId, startTime, endTime) => {
  clearMessage();

  try {
    await apiFetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ slotId, startTime, endTime })
    });

    showMessage('Appointment booked successfully.', 'success');
    await Promise.all([searchSlots(), loadAppointments()]);
  } catch (err) {
    showMessage(err.message || 'Unable to book appointment.');
  }
};

const resetDashboard = () => {
  clearMessage();
  slotSearchForm.reset();
  loadDashboard();
};

slotSearchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();

  try {
    await searchSlots();
  } catch (err) {
    showMessage(err.message || 'Unable to search slots.');
  }
});

clearSearchBtn.addEventListener('click', resetDashboard);
resetBtn.addEventListener('click', resetDashboard);

slotsListEl.addEventListener('click', (event) => {
  const button = event.target.closest('.book-slot-btn');
  if (!button || button.disabled) return;

  const card = button.closest('[data-slot-card]');
  const selectedTime = card.querySelector('.slot-time-select').value;
  const [startTime, endTime] = selectedTime.split('|');

  bookSlot(button.dataset.slotId, startTime, endTime);
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('firstLogin');
  window.location.href = 'index.html';
});

loadDashboard();
