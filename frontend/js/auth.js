/** Authentication Logic - Refactored for Professional UI */
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showLogin = document.getElementById("showLogin");
const showRegister = document.getElementById("showRegister");
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const authMessage = document.getElementById("authMessage");

const API_BASE =
  window.location.protocol === "file:" || window.location.port !== "3000"
    ? "http://localhost:3000"
    : window.location.origin;

/** Utilities */
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return {};
  }
};

const displayMessage = (msg, isError = true) => {
  const type = isError ? "danger" : "success";
  authMessage.innerHTML = `<div class="alert alert-${type} fade show" role="alert">${msg}</div>`;
};

const showSection = (section) => {
  loginSection.classList.toggle("d-none", section !== "login");
  registerSection.classList.toggle("d-none", section !== "register");
  authMessage.innerHTML = "";
};

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
      const authData = data.data || data;
      const token = authData.token;
      const decoded = parseJwt(token);
      const role = authData.user?.role || decoded.role;
      const firstLogin = Boolean(
        authData.firstLogin || authData.user?.firstLogin || decoded.firstLogin,
      );

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("firstLogin", String(firstLogin));

      redirectUser(role, firstLogin);
    } else {
      displayMessage(data.error || data.message || "Invalid credentials.");
    }
  } catch (error) {
    displayMessage("Server unreachable. Please ensure the backend is active.");
  }
});

const redirectUser = (role, firstLogin) => {
  if (role === "admin") window.location.href = "admin.html";
  else if (role === "doctor")
    window.location.href = firstLogin ? "changePassword.html" : "doctor.html";
  else window.location.href = "patient.html";
};

/** Registration Handler */
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const patientName = document.getElementById("patientName").value;
  const contact = document.getElementById("contact").value;
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const dob = document.getElementById("dob").value;
  const address = document.getElementById("address").value;

  const payload = { patientName, contact, email, password, dob, address };

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok) {
      displayMessage(
        "Account created successfully. You may now log in.",
        false,
      );
      registerForm.reset();
      setTimeout(() => showSection("login"), 2000);
    } else {
      displayMessage(data.error || "Registration encountered an error.");
    }
  } catch (error) {
    displayMessage("Server connectivity issue.");
  }
});

showLogin.addEventListener("click", () => showSection("login"));
showRegister.addEventListener("click", () => showSection("register"));
