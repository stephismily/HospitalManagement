const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const doctorRoutes = require('./api/routes/doctorRoutes');
const patientRoutes = require('./api/routes/patientRoutes');
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);

app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static('frontend'));

const authRoutes = require('./api/routes/authRoutes');
const doctorRoutes = require('./api/routes/doctorRoutes');
const patientRoutes = require('./api/routes/patientRoutes');
const slotRoutes = require('./api/routes/slotRoutes');
const appointmentRoutes = require('./api/routes/appointmentRoutes');
const adminRoutes = require('./api/routes/adminRoutes');
const errorHandler = require('./api/middleware/errorHandler');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => console.log(err));

// Routes
app.get('/health', (req, res) => res.json({ data: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
