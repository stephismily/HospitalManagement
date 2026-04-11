const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static('frontend'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./api/routes/authRoutes'));
app.use('/api/admin', require('./api/routes/adminRoutes'));
// Add other routes here

// Error handling middleware
const errorMiddleware = require('./api/middleware/errorMiddleware');
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});