const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');

// Generate password based on pattern: first 3 letters of name + first 3 digits of phone
const generatePassword = (doctorName, contact) => {
  // Get first 3 letters of doctor name (lowercase)
  const namePrefix = doctorName.substring(0, 3).toLowerCase();
  
  // Get first 3 digits from phone number
  const phoneDigits = contact.replace(/\D/g, '').substring(0, 3);
  
  return namePrefix + phoneDigits;
};

// Onboard Doctor
const onboardDoctor = async (req, res, next) => {
  const { doctorName, specialization, contact, email } = req.body;
  
  try {
    // Validate required fields
    if (!doctorName || !specialization || !contact || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor with this email already exists' });
    }

    // Generate password based on pattern
    const tempPassword = generatePassword(doctorName, contact);

    // Create new doctor with auto-generated password
    const doctor = new Doctor({
      doctorName,
      specialization,
      contact,
      email,
      password: await bcrypt.hash(tempPassword, 10),
      role: 'doctor',
      firstLogin: true
    });

    await doctor.save();

    return res.status(201).json({
      data: {
        message: 'Doctor onboarded successfully',
        doctor: {
          id: doctor._id,
          doctorName: doctor.doctorName,
          email: doctor.email,
          specialization: doctor.specialization,
          contact: doctor.contact
        },
        tempPassword
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get all doctors
const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().select('-password');
    return res.json({ data: doctors });
  } catch (err) {
    next(err);
  }
};

// Delete doctor
const deleteDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findByIdAndDelete(doctorId);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.json({ data: { message: 'Doctor deleted successfully' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { onboardDoctor, getAllDoctors, deleteDoctor };
