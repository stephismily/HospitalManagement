const swaggerUi = require("swagger-ui-express");

const specs = {
  openapi: "3.0.3",
  info: {
    title: "Hospital Management API",
    version: "1.0.0",
    description:
      "Swagger UI documentation for authentication, doctors, patients, slots, appointments, admin operations, and health checks.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Doctors" },
    { name: "Patients" },
    { name: "Slots" },
    { name: "Appointments" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string", example: "Invalid credentials" } },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          role: { type: "string", example: "patient" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          firstLogin: { type: "boolean" },
        },
      },
      AuthPayload: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          token: { type: "string" },
          firstLogin: { type: "boolean" },
        },
      },
      Doctor: {
        type: "object",
        properties: {
          _id: { type: "string" },
          doctorName: { type: "string" },
          specialization: { type: "string" },
          contact: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string" },
          firstLogin: { type: "boolean" },
        },
      },
      Patient: {
        type: "object",
        properties: {
          _id: { type: "string" },
          patientName: { type: "string" },
          contact: { type: "string" },
          email: { type: "string", format: "email" },
          dob: { type: "string", format: "date-time" },
          address: { type: "string" },
          role: { type: "string" },
        },
      },
      Slot: {
        type: "object",
        properties: {
          _id: { type: "string" },
          doctorId: { oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Doctor" }] },
          date: { type: "string", format: "date-time" },
          startTime: { type: "string", example: "10:00" },
          endTime: { type: "string", example: "10:30" },
          isAvailable: { type: "boolean" },
        },
      },
      Appointment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          doctorId: { oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Doctor" }] },
          patientId: { oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Patient" }] },
          slotId: { oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Slot" }] },
          status: { type: "string", enum: ["booked", "completed", "cancelled"] },
          doctorNotes: { type: "string" },
          cancelReason: { type: "string" },
        },
      },
      MessagePayload: {
        type: "object",
        properties: { message: { type: "string", example: "Operation successful" } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a patient or doctor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "Use patientName and dob for patients, or doctorName and specialization for doctors.",
                properties: {
                  role: { type: "string", enum: ["patient", "doctor"] },
                  patientName: { type: "string" },
                  doctorName: { type: "string" },
                  specialization: { type: "string" },
                  contact: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  dob: { type: "string", format: "date" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Registered successfully" },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          409: { description: "Email already in use" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/AuthPayload" } } } } },
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/change-password-first-login": {
      post: {
        tags: ["Auth"],
        summary: "Change password on doctor first login",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["newPassword"],
                properties: { newPassword: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Password changed" }, 401: { description: "Unauthorized" } },
      },
    },
    "/api/doctors": {
      get: {
        tags: ["Doctors"],
        summary: "List all doctors",
        responses: {
          200: {
            description: "Doctor list",
            content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Doctor" } } } } } },
          },
        },
      },
    },
    "/api/doctors/me": {
      get: {
        tags: ["Doctors"],
        summary: "Get logged-in doctor profile",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Doctor profile" }, 403: { description: "Doctor role required" } },
      },
      put: {
        tags: ["Doctors"],
        summary: "Update logged-in doctor profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  doctorName: { type: "string" },
                  specialization: { type: "string" },
                  contact: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Doctor updated" } },
      },
    },
    "/api/doctors/me/appointments": {
      get: {
        tags: ["Doctors"],
        summary: "Get appointments for logged-in doctor",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Appointment list" } },
      },
    },
    "/api/doctors/me/slots": {
      get: {
        tags: ["Doctors"],
        summary: "Get slots for logged-in doctor",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Slot list" } },
      },
    },
    "/api/patients/me": {
      get: {
        tags: ["Patients"],
        summary: "Get logged-in patient profile",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Patient profile" } },
      },
      put: {
        tags: ["Patients"],
        summary: "Update logged-in patient profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  patientName: { type: "string" },
                  contact: { type: "string" },
                  email: { type: "string", format: "email" },
                  dob: { type: "string", format: "date" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Patient updated" } },
      },
    },
    "/api/patients/me/appointments": {
      get: {
        tags: ["Patients"],
        summary: "Get appointments for logged-in patient",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Appointment list" } },
      },
    },
    "/api/slots": {
      get: {
        tags: ["Slots"],
        summary: "Search slots",
        parameters: [
          { in: "query", name: "doctorId", schema: { type: "string" } },
          { in: "query", name: "doctorName", schema: { type: "string" } },
          { in: "query", name: "specialization", schema: { type: "string" } },
          { in: "query", name: "date", schema: { type: "string", format: "date" } },
          { in: "query", name: "isAvailable", schema: { type: "boolean" } },
        ],
        responses: { 200: { description: "Matching slots" } },
      },
      post: {
        tags: ["Slots"],
        summary: "Create a slot",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date", "startTime", "endTime"],
                properties: {
                  date: { type: "string", format: "date" },
                  startTime: { type: "string", example: "10:00" },
                  endTime: { type: "string", example: "12:00" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Slot created" } },
      },
    },
    "/api/slots/{slotId}": {
      put: {
        tags: ["Slots"],
        summary: "Update a slot",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "slotId", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Slot updated" } },
      },
      delete: {
        tags: ["Slots"],
        summary: "Delete a slot",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "slotId", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Slot deleted" } },
      },
    },
    "/api/appointments": {
      get: {
        tags: ["Appointments"],
        summary: "List appointments",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "doctorId", schema: { type: "string" } },
          { in: "query", name: "patientId", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Appointment list" } },
      },
      post: {
        tags: ["Appointments"],
        summary: "Book an appointment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["slotId"],
                properties: {
                  slotId: { type: "string" },
                  startTime: { type: "string", example: "10:30" },
                  endTime: { type: "string", example: "11:00" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Appointment booked" }, 409: { description: "Conflict" } },
      },
    },
    "/api/appointments/{id}": {
      get: {
        tags: ["Appointments"],
        summary: "Get appointment by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Appointment details" } },
      },
    },
    "/api/appointments/{id}/cancel": {
      put: {
        tags: ["Appointments"],
        summary: "Cancel an appointment",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["cancelReason"],
                properties: { cancelReason: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Appointment cancelled" } },
      },
    },
    "/api/appointments/{id}/complete": {
      put: {
        tags: ["Appointments"],
        summary: "Complete an appointment",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["doctorNotes"],
                properties: { doctorNotes: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "Appointment completed" } },
      },
    },
    "/api/admin/onboard-doctor": {
      post: {
        tags: ["Admin"],
        summary: "Onboard a doctor",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["doctorName", "specialization", "contact", "email"],
                properties: {
                  doctorName: { type: "string" },
                  specialization: { type: "string" },
                  contact: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Doctor onboarded with temp password" } },
      },
    },
    "/api/admin/doctors": {
      get: {
        tags: ["Admin"],
        summary: "List doctors as admin",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Doctor list" } },
      },
    },
    "/api/admin/doctors/{doctorId}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete doctor",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "doctorId", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Doctor deleted" } },
      },
    },
  },
};

module.exports = { swaggerUi, specs };
