const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showLogin = document.getElementById('showLogin');
const showRegister = document.getElementById('showRegister');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const authMessage = document.getElementById('authMessage');

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
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    const decoded = parseJwt(data.token);
    localStorage.setItem('role', decoded.role);
    
    if (decoded.role === 'admin') {
      window.location.href = 'admin.html';
    } else if (decoded.role === 'doctor') {
      if (decoded.firstLogin) {
        window.location.href = 'changePassword.html';
      } else {
        window.location.href = 'doctor.html';
      }
    } else {
      window.location.href = 'patient.html';
    }
  } else {
    authMessage.innerHTML = `<div class="alert alert-danger">${data.message || 'Login failed'}</div>`;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const patientName = document.getElementById('patientName').value;
  const contact = document.getElementById('contact').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const dob = document.getElementById('dob').value;
  const address = document.getElementById('address').value;

  const payload = { patientName, contact, email, password, dob, address };

    const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (response.ok) {
    authMessage.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
    registerForm.reset();
  } else {
    authMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Registration failed'}</div>`;
  }
});

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return {};
  }
}
