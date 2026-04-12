const token = localStorage.getItem("token");
const API_BASE =
  window.location.protocol === "file:" || window.location.port !== "3000"
    ? "http://localhost:3000"
    : window.location.origin;

const profileEl = document.getElementById("profile");
const slotsListEl = document.getElementById("slotsList");
const appointmentsListEl = document.getElementById("appointmentsList");
const messageEl = document.getElementById("patientMessage");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");
const slotSearchForm = document.getElementById("slotSearchForm");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const doctorNameEl = document.getElementById("doctorName");
const slotDateEl = document.getElementById("slotDate");
const specializationEl = document.getElementById("specialization");
const welcomeUserEl = document.getElementById("welcomeUser");

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
  if (!specializationEl) return;
  const dataList = document.createElement("datalist");
  dataList.id = "specializationList";
  SPECIALIZATIONS.sort().forEach((spec) => {
    const option = document.createElement("option");
    option.value = spec;
    dataList.appendChild(option);
  });
  document.body.appendChild(dataList);
  specializationEl.setAttribute("list", "specializationList");
  specializationEl.placeholder = "Select or search specialization...";
  specializationEl.type = "search";

  // Allow re-selection by clearing on click
  specializationEl.addEventListener("click", () => {
    specializationEl.value = "";
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
    welcomeUserEl.textContent = `Welcome, ${localStorage.getItem("userName") || "Patient"}`;
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

if (!token || localStorage.getItem("role") !== "patient") {
  window.location.href = "index.html";
}

const formatDate = (date) => {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString();
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
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
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const showMessage = (message, type = "danger") => {
  messageEl.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
};

const clearMessage = () => {
  messageEl.innerHTML = "";
};

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

  if (!response.ok) {
    throw new Error(body.error || body.message || "Request failed");
  }

  return body.data;
};

const renderProfile = (patient) => {
  profileEl.innerHTML = `
    <div><strong>Name:</strong> ${escapeHtml(patient.patientName || "Not set")}</div>
    <div><strong>Email:</strong> ${escapeHtml(patient.email || "Not set")}</div>
    <div><strong>Contact:</strong> ${escapeHtml(patient.contact || "Not set")}</div>
    <div><strong>Date of Birth:</strong> ${escapeHtml(formatDate(patient.dob))}</div>
    <div><strong>Address:</strong> ${escapeHtml(patient.address || "Not set")}</div>
  `;
};

const getDoctor = (slot) => slot.doctorId || {};

const renderSlots = (slots) => {
  const now = new Date();
  // Filter out slots that have already ended
  const visibleSlots = slots.filter((slot) => {
    if (!slot.date || !slot.endTime) return true;
    const [hours, minutes] = slot.endTime.split(":").map(Number);
    const end = new Date(slot.date);
    end.setHours(hours, minutes, 0, 0);
    return end > now;
  });

  if (!visibleSlots.length) {
    slotsListEl.innerHTML =
      '<div class="col-12"><div class="alert alert-info">No available slots found.</div></div>';
    return;
  }

  slotsListEl.innerHTML = visibleSlots
    .map((slot) => {
      const doctor = getDoctor(slot);
      const disabled = slot.isAvailable ? "" : "disabled";
      const buttonText = slot.isAvailable
        ? "Book Appointment"
        : "Already Booked";
      const timeOptions = buildThirtyMinuteOptions(slot);

      return `
      <div class="col-md-6">
        <div class="card p-3 h-100 slot-card" data-slot-card="${escapeHtml(slot._id)}">
          <h5 class="card-title text-primary">${escapeHtml(doctor.doctorName || "Doctor")}</h5>
          <div class="text-muted mb-2">${escapeHtml(doctor.specialization || "General")}</div>
          <div><strong>Date:</strong> ${escapeHtml(formatDate(slot.date))}</div>
          <div><strong>Time:</strong> ${escapeHtml(slot.startTime || "Not set")} - ${escapeHtml(slot.endTime || "Not set")}</div>
          
          <label class="form-label mt-3 small fw-bold" for="slotTime-${escapeHtml(slot._id)}">Select Appointment Time</label>
          <select class="form-select slot-time-select" id="slotTime-${escapeHtml(slot._id)}" ${disabled}>
            ${timeOptions
              .map(
                (option) => `
              <option value="${option.startTime}|${option.endTime}">
                ${option.startTime} - ${option.endTime}
              </option>
            `,
              )
              .join("")}
          </select>
          <button class="btn btn-primary w-100 mt-3 book-slot-btn" data-slot-id="${escapeHtml(slot._id)}" ${disabled || !timeOptions.length ? "disabled" : ""}>${buttonText}</button>
        </div>
      </div>
    `;
    })
    .join("");
};

const renderAppointments = (appointments) => {
  const categories = {
    booked: appointments.filter((a) => a.status === "booked"),
    completed: appointments.filter((a) => a.status === "completed"),
    cancelled: appointments.filter((a) => a.status === "cancelled"),
  };

  const renderGroup = (title, list, emptyMsg) => {
    const cards = list
      .map((appointment) => {
        const doctor = appointment.doctorId || {};
        const slot = appointment.slotId || {};

        return `
      <div class="col-md-6">
        <div class="card p-3 h-100 shadow-sm border-0">
          <h5 class="text-secondary">${escapeHtml(doctor.doctorName || "Doctor")}</h5>
          <div><strong>Date:</strong> ${escapeHtml(formatDate(slot.date))}</div>
          <div><strong>Time:</strong> ${escapeHtml(slot.startTime || "Not set")} - ${escapeHtml(slot.endTime || "Not set")}</div>
          <div class="mt-2"><strong>Status:</strong> <span class="badge bg-info text-dark">${escapeHtml(appointment.status || "Not set")}</span></div>
          
          ${appointment.doctorNotes ? `<div class="mt-2 p-2 bg-light rounded small"><strong>Doctor Notes:</strong> ${escapeHtml(appointment.doctorNotes)}</div>` : ""}
          ${appointment.cancelReason ? `<div><strong>Cancel Reason:</strong> ${escapeHtml(appointment.cancelReason)}</div>` : ""}
        </div>
      </div>
    `;
      })
      .join("");

    return `
      <div class="col-12 mt-4">
        <h4 class="border-bottom pb-2">${title}</h4>
      </div>
      ${cards || `<div class="col-12"><div class="alert alert-light">${emptyMsg}</div></div>`}
    `;
  };

  appointmentsListEl.innerHTML = `
    <div class="row">
      ${renderGroup("Upcoming Appointments", categories.booked, "You have no upcoming appointments.")}
      ${renderGroup("Past Consultations", categories.completed, "No past consultations found.")}
      ${renderGroup("Cancelled Appointments", categories.cancelled, "No cancelled appointments.")}
    </div>
  `;
};

const getSearchParams = () => {
  const params = new URLSearchParams({ isAvailable: "true" });

  if (doctorNameEl.value.trim())
    params.set("doctorName", doctorNameEl.value.trim());
  if (slotDateEl.value) params.set("date", slotDateEl.value);
  if (specializationEl.value.trim())
    params.set("specialization", specializationEl.value.trim());

  return params;
};

const loadProfile = async () => {
  const profile = await apiFetch("/api/patients/me");
  renderProfile(profile);
};

const loadAppointments = async () => {
  const appointments = await apiFetch("/api/patients/me/appointments");
  renderAppointments(appointments);
};

const searchSlots = async () => {
  const params = getSearchParams();
  const slots = await apiFetch(`/api/slots?${params.toString()}`);
  renderSlots(slots);
};

const loadDashboard = async () => {
  clearMessage();

  try {
    await Promise.all([loadProfile(), searchSlots(), loadAppointments()]);
  } catch (err) {
    showMessage(err.message || "Unable to load patient dashboard.");
  }
};

const bookSlot = async (slotId, startTime, endTime) => {
  clearMessage();

  try {
    await apiFetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify({ slotId, startTime, endTime }),
    });

    showMessage("Appointment booked successfully.", "success");
    await Promise.all([searchSlots(), loadAppointments()]);
  } catch (err) {
    showMessage(err.message || "Unable to book appointment.");
  }
};

const resetDashboard = () => {
  clearMessage();
  slotSearchForm.reset();
  loadDashboard();
};

slotSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  try {
    await searchSlots();
  } catch (err) {
    showMessage(err.message || "Unable to search slots.");
  }
});

clearSearchBtn.addEventListener("click", resetDashboard);
resetBtn.addEventListener("click", resetDashboard);

slotsListEl.addEventListener("click", (event) => {
  const button = event.target.closest(".book-slot-btn");
  if (!button || button.disabled) return;

  const card = button.closest("[data-slot-card]");
  const selectedTime = card.querySelector(".slot-time-select").value;
  const [startTime, endTime] = selectedTime.split("|");

  bookSlot(button.dataset.slotId, startTime, endTime);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("firstLogin");
  window.location.href = "index.html";
});

initTheme();
setupSpecializationDropdown();
loadDashboard();
