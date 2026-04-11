const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

app.use(express.json());

app.use('/api/auth', authRoutes);

// health
app.get('/health', (req, res) => res.json({ data: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
