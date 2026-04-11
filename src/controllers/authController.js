const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // Assumed to exist and implemented by the team

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
	return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

exports.register = async (req, res, next) => {
	try {
		const { name, email, password, role } = req.body;
		if (!name || !email || !password || !role) {
			return res.status(400).json({ error: 'name, email, password and role are required' });
		}
		if (!['doctor', 'patient'].includes(role)) {
			return res.status(400).json({ error: 'role must be either "doctor" or "patient"' });
		}

		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ error: 'Email already in use' });

		const hashed = await bcrypt.hash(password, 10);
		const newUser = await User.create({ name, email, password: hashed, role });

		const token = generateToken(newUser);

		return res.status(201).json({ data: { user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }, token } });
	} catch (err) {
		next(err);
	}
};

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

		const user = await User.findOne({ email }).select('+password');
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });

		const match = await bcrypt.compare(password, user.password);
		if (!match) return res.status(401).json({ error: 'Invalid credentials' });

		const token = generateToken(user);
		return res.status(200).json({ data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token } });
	} catch (err) {
		next(err);
	}
};
