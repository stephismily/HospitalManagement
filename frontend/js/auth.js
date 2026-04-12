const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showLogin = document.getElementById('showLogin');
const showRegister = document.getElementById('showRegister');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const authMessage = document.getElementById('authMessage');
const API_BASE = window.location.protocol === 'file:' || window.location.port !== '3000'
  ? 'http://localhost:3000'
  : window.location.origin;

const showSection = (section) => {
  if (section === 'login') {
    loginSection.classList.remove('d-none');
    registerSection.classList.add('d-none');
  } else {
    loginSection.classList.add('d-none');
    registerSection.classList.remove('d-none');
  }
  authMessage.innerHTML = '';
};

showLogin.addEventListener('click', () => showSection('login'));
showRegister.addEventListener('click', () => showSection('register'));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
      const authData = data.data || data;
      const token = authData.token;
      const decoded = parseJwt(token);
      const role = authData.user?.role || decoded.role;
      const firstLogin = Boolean(authData.firstLogin || authData.user?.firstLogin || decoded.firstLogin);

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('firstLogin', String(firstLogin));

      if (role === 'admin') {
        window.location.href = 'admin.html';
      } else if (role === 'doctor') {
        if (firstLogin) {
          window.location.href = 'changePassword.html';
        } else {
          window.location.href = 'doctor.html';
        }
      } else {
        window.location.href = 'patient.html';
      }
    } else {
      authMessage.innerHTML = `<div class="alert alert-danger">${data.error || data.message || 'Login failed'}</div>`;
    }
  } catch (error) {
    authMessage.innerHTML = '<div class="alert alert-danger">Unable to reach the server. Make sure the backend is running on port 3000.</div>';
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const patientName = document.getElementById('patientName').value;
  const contact = document.getElementById('contact').value;
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const dob = document.getElementById('dob').value;
  const address = document.getElementById('address').value;

  const payload = { patientName, contact, email, password, dob, address };

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok) {
      authMessage.innerHTML = '<div class="alert alert-success">Registration successful. You can now log in.</div>';
      registerForm.reset();
    } else {
      authMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Registration failed'}</div>`;
    }
  } catch (error) {
    authMessage.innerHTML = '<div class="alert alert-danger">Unable to reach the server. Make sure the backend is running on port 3000.</div>';
  }
});

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return {};
  }
}
