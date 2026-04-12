const token = localStorage.getItem("token");
const API_BASE =
  window.location.protocol === "file:" || window.location.port !== "3000"
    ? "http://localhost:3000"
    : window.location.origin;

const profileEl = document.getElementById("profile");
const slotsListEl = document.getElementById("slotsList");
const appointmentsListEl = document.getElementById("appointmentsList");
const messageEl = document.getElementById("doctorMessage");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");
const slotForm = document.getElementById("slotForm");
const slotDateEl = document.getElementById("slotDate");
const slotStartTimeEl = document.getElementById("slotStartTime");
const slotEndTimeEl = document.getElementById("slotEndTime");
const welcomeUserEl = document.getElementById("welcomeUser");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
let slotIdToDelete = null;

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
    welcomeUserEl.textContent = `Welcome, ${localStorage.getItem("userName") || "Doctor"}`;
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

if (!token || localStorage.getItem("role") !== "doctor") {
  window.location.href = "index.html";
}

const formatDate = (date) => {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString();
};

const escapeHtml = (value) => {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const parseJwt = (value) => {
  try {
    return JSON.parse(atob(value.split(".")[1]));
  } catch (err) {
    return {};
  }
};

const showMessage = (message, type = "danger") => {
  messageEl.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
};

const clearMessage = () => {
  messageEl.innerHTML = "";
};

const setSlotFormDefaults = () => {
  slotDateEl.min = new Date().toISOString().slice(0, 10);
  slotDateEl.value = "";
  slotStartTimeEl.value = "";
  slotEndTimeEl.value = "";
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

const loadProfile = async () => {
  try {
    return await apiFetch("/api/doctors/me");
  } catch (err) {
    const decoded = parseJwt(token);
    const doctors = await apiFetch("/api/doctors");
    return doctors.find(
      (doctor) => doctor._id === decoded.userId || doctor._id === decoded.id,
    );
  }
};

const renderProfile = (doctor) => {
  profileEl.innerHTML = `
    <div><strong>Name:</strong> ${escapeHtml(doctor.doctorName || "Not set")}</div>
    <div><strong>Email:</strong> ${escapeHtml(doctor.email || "Not set")}</div>
    <div><strong>Specialization:</strong> ${escapeHtml(doctor.specialization || "Not set")}</div>
    <div><strong>Contact:</strong> ${escapeHtml(doctor.contact || "Not set")}</div>
  `;
};

/** Merges consecutive slots for a unified schedule view */
const mergeSlots = (slots) => {
  if (!slots.length) return [];

  // Sort by date then startTime
  const sorted = [...slots].sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const merged = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    // Merge if same date and consecutive times
    if (current.date === next.date && current.endTime === next.startTime) {
      current.endTime = next.endTime;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
};

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
      '<div class="col-12"><div class="alert alert-info">No slots found.</div></div>';
    return;
  }

  slotsListEl.innerHTML = visibleSlots
    .map(
      (slot) => `
    <div class="col-md-6">
      <div class="card p-3 h-100 slot-card">
        <div class="small text-muted mb-1">Schedule Block</div>
        <div><strong>Date:</strong> ${formatDate(slot.date)}</div>
        <div><strong>Time:</strong> ${escapeHtml(slot.startTime || "Not set")} - ${escapeHtml(slot.endTime || "Not set")}</div>
        <button class="btn-primary mt-3 delete-slot-btn" 
                style="background: var(--danger); padding: 0.4rem 0.8rem; font-size: 0.8rem;" 
                data-slot-id="${slot._id}">
          Remove Slot
        </button>
      </div>
    </div>
  `,
    )
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
        const patient = appointment.patientId || {};
        const slot = appointment.slotId || {};
        const isBooked = appointment.status === "booked";
        const actionButtons = isBooked
          ? `
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-success complete-appointment-btn" data-appointment-id="${appointment._id}">Mark Completed</button>
          <button class="btn btn-outline-danger cancel-appointment-btn" data-appointment-id="${appointment._id}">Cancel</button>
        </div>
      `
          : "";

        return `
      <div class="col-md-6">
        <div class="card p-3 h-100 appointment-card-booked">
          <div><strong>Patient:</strong> ${escapeHtml(patient.patientName || "Patient")}</div>
          <div><strong>Date:</strong> ${escapeHtml(formatDate(slot.date))}</div>
          <div><strong>Time:</strong> ${escapeHtml(slot.startTime || "Not set")} - ${escapeHtml(slot.endTime || "Not set")}</div>
          <div class="mb-2"><strong>Status:</strong> <span class="text-capitalize">${escapeHtml(appointment.status || "Not set")}</span></div>
          ${appointment.doctorNotes ? `<div class="small text-muted"><strong>Notes:</strong> ${escapeHtml(appointment.doctorNotes)}</div>` : ""}
          ${appointment.cancelReason ? `<div class="small text-danger"><strong>Cancelled:</strong> ${escapeHtml(appointment.cancelReason)}</div>` : ""}
          ${actionButtons}
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
      ${renderGroup("Booked Appointments", categories.booked, "No upcoming appointments.")}
      ${renderGroup("Completed Appointments", categories.completed, "No completed appointments.")}
      ${renderGroup("Cancelled Appointments", categories.cancelled, "No cancelled appointments.")}
    </div>
  `;
};

const loadDashboard = async () => {
  clearMessage();

  try {
    const [profile, slots, appointments] = await Promise.all([
      loadProfile(),
      apiFetch("/api/doctors/me/slots"),
      apiFetch("/api/doctors/me/appointments"),
    ]);

    if (!profile) {
      throw new Error("Doctor profile not found");
    }

    renderProfile(profile);
    renderSlots(slots);
    renderAppointments(appointments);
  } catch (err) {
    showMessage(err.message || "Unable to load doctor dashboard.");
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
    showMessage("End time must be after start time.");
    return;
  }

  try {
    const createdSlots = await apiFetch("/api/slots", {
      method: "POST",
      body: JSON.stringify({ date, startTime, endTime }),
    });

    slotForm.reset();
    showMessage(
      `${createdSlots.length || 1} slot${createdSlots.length === 1 ? "" : "s"} added successfully.`,
      "success",
    );

    const slots = await apiFetch("/api/doctors/me/slots");
    renderSlots(slots);
  } catch (err) {
    showMessage(err.message || "Unable to add slot.");
  }
};

const completeAppointment = async (appointmentId) => {
  const doctorNotes = window.prompt(
    "Add doctor notes for this completed appointment:",
  );

  if (doctorNotes === null) return;
  if (!doctorNotes.trim()) {
    showMessage(
      "Doctor notes are required to mark an appointment as completed.",
    );
    return;
  }

  try {
    await apiFetch(`/api/appointments/${appointmentId}/complete`, {
      method: "PUT",
      body: JSON.stringify({ doctorNotes: doctorNotes.trim() }),
    });

    showMessage("Appointment marked as completed.", "success");
    const appointments = await apiFetch("/api/doctors/me/appointments");
    renderAppointments(appointments);
  } catch (err) {
    showMessage(err.message || "Unable to complete appointment.");
  }
};

const cancelAppointment = async (appointmentId) => {
  const cancelReason = window.prompt(
    "State the reason for cancelling this appointment:",
  );

  if (cancelReason === null) return;
  if (!cancelReason.trim()) {
    showMessage("Cancel reason is required to cancel an appointment.");
    return;
  }

  try {
    await apiFetch(`/api/appointments/${appointmentId}/cancel`, {
      method: "PUT",
      body: JSON.stringify({ cancelReason: cancelReason.trim() }),
    });

    showMessage("Appointment cancelled.", "success");
    const [slots, appointments] = await Promise.all([
      apiFetch("/api/doctors/me/slots"),
      apiFetch("/api/doctors/me/appointments"),
    ]);
    renderSlots(slots);
    renderAppointments(appointments);
  } catch (err) {
    showMessage(err.message || "Unable to cancel appointment.");
  }
};

const deleteSlot = (slotId) => {
  slotIdToDelete = slotId;
  deleteModal.classList.add("active");
};

const executeDelete = async () => {
  if (!slotIdToDelete) return;

  const slotId = slotIdToDelete;
  hideDeleteModal();
  clearMessage();
  try {
    await apiFetch(`/api/slots/${slotId}`, {
      method: "DELETE",
    });
    showMessage("Slot removed successfully.", "success");
    const [slots, appointments] = await Promise.all([
      apiFetch("/api/doctors/me/slots"),
      apiFetch("/api/doctors/me/appointments"),
    ]);
    renderSlots(slots);
    renderAppointments(appointments);
  } catch (err) {
    showMessage(err.message || "Unable to remove slot. It might be booked.");
  }
};

const hideDeleteModal = () => {
  slotIdToDelete = null;
  deleteModal.classList.remove("active");
};

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("firstLogin");
  window.location.href = "index.html";
});

resetBtn.addEventListener("click", resetDashboard);
slotForm.addEventListener("submit", createSlot);
appointmentsListEl.addEventListener("click", (event) => {
  const completeButton = event.target.closest(".complete-appointment-btn");
  const cancelButton = event.target.closest(".cancel-appointment-btn");

  if (completeButton) {
    completeAppointment(completeButton.dataset.appointmentId);
  }

  if (cancelButton) {
    cancelAppointment(cancelButton.dataset.appointmentId);
  }
});

slotsListEl.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-slot-btn");
  if (deleteButton) {
    deleteSlot(deleteButton.dataset.slotId);
  }
});

confirmDeleteBtn.addEventListener("click", executeDelete);
cancelDeleteBtn.addEventListener("click", hideDeleteModal);

initTheme();
setSlotFormDefaults();
loadDashboard();
