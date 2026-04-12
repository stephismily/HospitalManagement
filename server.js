const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./api/routes/authRoutes');
const doctorRoutes = require('./api/routes/doctorRoutes');
const patientRoutes = require('./api/routes/patientRoutes');
const slotRoutes = require('./api/routes/slotRoutes');
const appointmentRoutes = require('./api/routes/appointmentRoutes');
const adminRoutes = require('./api/routes/adminRoutes');
const errorHandler = require('./api/middleware/errorHandler');
const connectDB = require('./api/config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

connectDB();

app.get('/health', (req, res) => res.json({ data: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing server or change PORT in .env.`);
    process.exit(1);
  }

  throw err;
});

module.exports = { app, server };
