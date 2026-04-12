const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const API_BASE =
  window.location.protocol === "file:" || window.location.port !== "3000"
    ? "http://localhost:3000"
    : window.location.origin;

const welcomeUserEl = document.getElementById("welcomeUser");
const onboardForm = document.getElementById("onboardForm");
const onboardAlert = document.getElementById("onboardAlert");
const tempPasswordDiv = document.getElementById("tempPasswordDiv");
const tempPasswordDisplay = document.getElementById("tempPasswordDisplay");
const doctorsBody = document.getElementById("doctorsBody");
const noDoctorsMsg = document.getElementById("noDoctorsMsg");

const SPECIALIZATIONS = [
  "Cardiology",
  "Dentistry",
  "Dermatology",
  "Endocrinology",
  "ENT Specialist",
  "Gastroenterology",
  "General Physician",
  "Gynecology",
  "Nephrology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Urology",
];

const setupSpecializationDropdown = () => {
  const specInput = document.getElementById("specialization");
  if (!specInput) return;
  const dataList = document.createElement("datalist");
  dataList.id = "specializationList";
  SPECIALIZATIONS.sort().forEach((spec) => {
    const option = document.createElement("option");
    option.value = spec;
    dataList.appendChild(option);
  });
  document.body.appendChild(dataList);
  specInput.setAttribute("list", "specializationList");
  specInput.placeholder = "Select or search specialization...";
  specInput.type = "search";

  // Allow re-selection by clearing on click
  specInput.addEventListener("click", () => {
    specInput.value = "";
  });
};

/** Theme Management */
const initTheme = () => {
  const themeToggle = document.getElementById("themeToggle");
  const currentTheme = localStorage.getItem("theme") || "light";

  const style = document.createElement("style");
  style.textContent = `
    input::-webkit-calendar-picker-indicator,
    input::-webkit-list-button,
    input::-webkit-search-cancel-button {
      filter: none;
    }
    [data-theme='dark'] input::-webkit-calendar-picker-indicator,
    [data-theme='dark'] input::-webkit-list-button,
    [data-theme='dark'] input::-webkit-search-cancel-button {
      filter: invert(1);
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  document.documentElement.setAttribute("data-theme", currentTheme);

  if (welcomeUserEl) {
    welcomeUserEl.textContent = `Welcome, ${localStorage.getItem("userName") || "Admin"}`;
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const theme = document.documentElement.getAttribute("data-theme");
      const newTheme = theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }
};

/** Authentication Check */
if (!token || role !== "admin") {
  window.location.href = "index.html";
}

/** API Helpers */
const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error || body.message || "Request failed");
  return body.data || body;
};

/** Load Doctors List */
async function loadDoctors() {
  try {
    const doctors = await apiFetch("/api/admin/doctors");
    if (doctors.length === 0) {
      doctorsBody.innerHTML = "";
      noDoctorsMsg.style.display = "block";
      return;
    }
    noDoctorsMsg.style.display = "none";
    doctorsBody.innerHTML = doctors
      .map(
        (doctor) => `
            <tr>
                <td>${doctor.doctorName}</td>
                <td>${doctor.email}</td>
                <td>${doctor.specialization}</td>
                <td>${doctor.contact}</td>
                <td>
                    <span class="badge ${doctor.firstLogin ? "bg-warning" : "bg-success"}">
                        ${doctor.firstLogin ? "Pending" : "Active"}
                    </span>
                </td>
                <td>
                    <button class="btn-danger-small" onclick="deleteDoctor('${doctor._id}', '${doctor.doctorName}')">Delete</button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (err) {
    console.error("Error loading doctors:", err);
  }
}

/** Onboard Form Handler */
onboardForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    doctorName: document.getElementById("doctorName").value,
    email: document.getElementById("email").value,
    specialization: document.getElementById("specialization").value,
    contact: document.getElementById("contact").value,
  };

  try {
    const result = await apiFetch("/api/admin/onboard-doctor", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    tempPasswordDisplay.textContent = result.tempPassword;
    tempPasswordDiv.style.display = "block";
    onboardForm.reset();
    loadDoctors();
  } catch (err) {
    alert("Error onboarding doctor: " + err.message);
  }
});

/** Global Actions */
window.deleteDoctor = async (doctorId, doctorName) => {
  if (!confirm(`Are you sure you want to delete Dr. ${doctorName}?`)) return;
  try {
    await apiFetch(`/api/admin/doctors/${doctorId}`, { method: "DELETE" });
    loadDoctors();
  } catch (err) {
    alert("Error: " + err.message);
  }
};

window.copyToClipboard = () => {
  navigator.clipboard
    .writeText(tempPasswordDisplay.textContent)
    .then(() => alert("Password copied!"));
};

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userName");
  window.location.href = "index.html";
});

/** Initialization */
initTheme();
setupSpecializationDropdown();
loadDoctors();
