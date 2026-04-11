const token = localStorage.getItem('token');
const API_BASE = window.location.port === '5000' ? window.location.origin : 'http://localhost:5000';

const profileEl = document.getElementById('profile');
const slotsListEl = document.getElementById('slotsList');
const appointmentsListEl = document.getElementById('appointmentsList');
const messageEl = document.getElementById('doctorMessage');
const resetBtn = document.getElementById('resetBtn');
const logoutBtn = document.getElementById('logoutBtn');
const slotForm = document.getElementById('slotForm');
const slotDateEl = document.getElementById('slotDate');
const slotStartTimeEl = document.getElementById('slotStartTime');
const slotEndTimeEl = document.getElementById('slotEndTime');

if (!token || localStorage.getItem('role') !== 'doctor') {
  window.location.href = 'index.html';
}

const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString();
};

const escapeHtml = (value) => {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const parseJwt = (value) => {
  try {
    return JSON.parse(atob(value.split('.')[1]));
  } catch (err) {
    return {};
  }
};

const showMessage = (message, type = 'danger') => {
  messageEl.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
};

const clearMessage = () => {
  messageEl.innerHTML = '';
};

const setSlotFormDefaults = () => {
  slotDateEl.min = new Date().toISOString().slice(0, 10);
  slotDateEl.value = '';
  slotStartTimeEl.value = '';
  slotEndTimeEl.value = '';
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

const loadProfile = async () => {
  try {
    return await apiFetch('/api/doctors/me');
  } catch (err) {
    const decoded = parseJwt(token);
    const doctors = await apiFetch('/api/doctors');
    return doctors.find((doctor) => doctor._id === decoded.userId || doctor._id === decoded.id);
  }
};

const renderProfile = (doctor) => {
  profileEl.innerHTML = `
    <div><strong>Name:</strong> ${escapeHtml(doctor.doctorName || 'Not set')}</div>
    <div><strong>Email:</strong> ${escapeHtml(doctor.email || 'Not set')}</div>
    <div><strong>Specialization:</strong> ${escapeHtml(doctor.specialization || 'Not set')}</div>
    <div><strong>Contact:</strong> ${escapeHtml(doctor.contact || 'Not set')}</div>
  `;
};

const renderSlots = (slots) => {
  if (!slots.length) {
    slotsListEl.innerHTML = '<div class="col-12"><div class="alert alert-info">No slots found.</div></div>';
    return;
  }

  slotsListEl.innerHTML = slots.map((slot) => `
    <div class="col-md-6">
      <div class="border rounded p-3 bg-white h-100">
        <div><strong>Date:</strong> ${formatDate(slot.date)}</div>
        <div><strong>Time:</strong> ${escapeHtml(slot.startTime || 'Not set')} - ${escapeHtml(slot.endTime || 'Not set')}</div>
        <div><strong>Status:</strong> ${slot.isAvailable ? 'Available' : 'Booked'}</div>
      </div>
    </div>
  `).join('');
};

const renderAppointments = (appointments) => {
  const visibleAppointments = appointments.filter((appointment) => appointment.status !== 'completed');

  if (!visibleAppointments.length) {
    appointmentsListEl.innerHTML = '<div class="col-12"><div class="alert alert-info">No appointments found.</div></div>';
    return;
  }

  appointmentsListEl.innerHTML = visibleAppointments.map((appointment) => {
    const patient = appointment.patientId || {};
    const slot = appointment.slotId || {};
    const isBooked = appointment.status === 'booked';
    const actionButtons = isBooked
      ? `
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-success complete-appointment-btn" data-appointment-id="${appointment._id}">Mark Completed</button>
          <button class="btn btn-outline-danger cancel-appointment-btn" data-appointment-id="${appointment._id}">Cancel</button>
        </div>
      `
      : '';

    return `
      <div class="col-md-6">
        <div class="border rounded p-3 bg-white h-100">
          <div><strong>Patient:</strong> ${escapeHtml(patient.patientName || 'Patient')}</div>
          <div><strong>Date:</strong> ${escapeHtml(formatDate(slot.date))}</div>
          <div><strong>Time:</strong> ${escapeHtml(slot.startTime || 'Not set')} - ${escapeHtml(slot.endTime || 'Not set')}</div>
          <div><strong>Status:</strong> ${escapeHtml(appointment.status || 'Not set')}</div>
          ${appointment.doctorNotes ? `<div><strong>Doctor Notes:</strong> ${escapeHtml(appointment.doctorNotes)}</div>` : ''}
          ${appointment.cancelReason ? `<div><strong>Cancel Reason:</strong> ${escapeHtml(appointment.cancelReason)}</div>` : ''}
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');
};

const loadDashboard = async () => {
  clearMessage();
  profileEl.textContent = 'Loading profile...';
  slotsListEl.textContent = 'Loading slots...';
  appointmentsListEl.textContent = 'Loading appointments...';

  try {
    const [profile, slots, appointments] = await Promise.all([
      loadProfile(),
      apiFetch('/api/doctors/me/slots'),
      apiFetch('/api/doctors/me/appointments')
    ]);

    if (!profile) {
      throw new Error('Doctor profile not found');
    }

    renderProfile(profile);
    renderSlots(slots);
    renderAppointments(appointments);
  } catch (err) {
    showMessage(err.message || 'Unable to load doctor dashboard.');
  }
};

const resetDashboard = () => {
  clearMessage();
  slotForm.reset();
  setSlotFormDefaults();
  loadDashboard();
};

const createSlot = async (event) => {
  event.preventDefault();
  clearMessage();

  const date = slotDateEl.value;
  const startTime = slotStartTimeEl.value;
  const endTime = slotEndTimeEl.value;

  if (startTime >= endTime) {
    showMessage('End time must be after start time.');
    return;
  }

  try {
    const createdSlots = await apiFetch('/api/slots', {
      method: 'POST',
      body: JSON.stringify({ date, startTime, endTime })
    });

    slotForm.reset();
    showMessage(`${createdSlots.length || 1} slot${createdSlots.length === 1 ? '' : 's'} added successfully.`, 'success');

    const slots = await apiFetch('/api/doctors/me/slots');
    renderSlots(slots);
  } catch (err) {
    showMessage(err.message || 'Unable to add slot.');
  }
};

const completeAppointment = async (appointmentId) => {
  const doctorNotes = window.prompt('Add doctor notes for this completed appointment:');

  if (doctorNotes === null) return;
  if (!doctorNotes.trim()) {
    showMessage('Doctor notes are required to mark an appointment as completed.');
    return;
  }

  try {
    await apiFetch(`/api/appointments/${appointmentId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ doctorNotes: doctorNotes.trim() })
    });

    showMessage('Appointment marked as completed.', 'success');
    const appointments = await apiFetch('/api/doctors/me/appointments');
    renderAppointments(appointments);
  } catch (err) {
    showMessage(err.message || 'Unable to complete appointment.');
  }
};

const cancelAppointment = async (appointmentId) => {
  const cancelReason = window.prompt('State the reason for cancelling this appointment:');

  if (cancelReason === null) return;
  if (!cancelReason.trim()) {
    showMessage('Cancel reason is required to cancel an appointment.');
    return;
  }

  try {
    await apiFetch(`/api/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ cancelReason: cancelReason.trim() })
    });

    showMessage('Appointment cancelled.', 'success');
    const [slots, appointments] = await Promise.all([
      apiFetch('/api/doctors/me/slots'),
      apiFetch('/api/doctors/me/appointments')
    ]);
    renderSlots(slots);
    renderAppointments(appointments);
  } catch (err) {
    showMessage(err.message || 'Unable to cancel appointment.');
  }
};

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('firstLogin');
  window.location.href = 'index.html';
});

resetBtn.addEventListener('click', resetDashboard);
slotForm.addEventListener('submit', createSlot);
appointmentsListEl.addEventListener('click', (event) => {
  const completeButton = event.target.closest('.complete-appointment-btn');
  const cancelButton = event.target.closest('.cancel-appointment-btn');

  if (completeButton) {
    completeAppointment(completeButton.dataset.appointmentId);
  }

  if (cancelButton) {
    cancelAppointment(cancelButton.dataset.appointmentId);
  }
});

setSlotFormDefaults();
loadDashboard();
