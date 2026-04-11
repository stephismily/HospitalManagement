const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization token missing' });

	const token = authHeader.split(' ')[1];
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = { id: decoded.userId, role: decoded.role };
		next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
};
