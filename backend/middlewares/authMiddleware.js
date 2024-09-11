require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header is required' });
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }

    try {
        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized, Token is not valid' });
    }

    // Token is valid; proceed to the next middleware or route handler
    next();
};

module.exports = authMiddleware;
