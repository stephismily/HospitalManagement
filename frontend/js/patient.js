// Search slots, book, cancel
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

// Load profile, appointments, search slots
// Implement fetch calls to /api/patients/profile, /api/appointments, /api/slots