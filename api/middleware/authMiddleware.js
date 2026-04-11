const jwt = require('jsonwebtoken');

const SECRET = "secret";

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }

        const decoded = jwt.verify(token, SECRET);

        req.user = decoded;

        next();

    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};