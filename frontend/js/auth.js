// Login/register fetch calls
const loginForm = document.getElementById('loginForm');
const registerLink = document.getElementById('registerLink');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    window.location.href = role === 'doctor' ? 'doctor.html' : 'patient.html';
  } else {
    alert(data.message);
  }
});

// Add register logic here