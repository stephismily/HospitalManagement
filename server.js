const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const doctorRoutes = require('./api/routes/doctorRoutes');
const patientRoutes = require('./api/routes/patientRoutes');
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => console.log(err));

// Routes
const authRoutes = require('./src/routes/authRoutes');
const slotRoutes = require('./src/routes/slotRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
// Add other routes here (doctors, patients, appointments)

const appointmentRoutes = require('./api/routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

// Global error handler
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});