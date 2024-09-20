require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { error } = require('console');
const jwt = require('jsonwebtoken');

class AuthMiddleware {
    static verifyToken = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({ message: 'Authorization header is required', error: error.message });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(400).json({ message: 'Token missing', error: error.message });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') { 
                return res.status(400).json({ message: 'Expired token', error: error.message });
            }
            if (err.name === 'JsonWebTokenError') { 
                return res.status(400).json({ message: 'Invalid token', error: error.message });
            }  
            return res.status(400).json({ message: 'Unauthorized, User not found. Token is not valid', error: error.message });
        }
    }
};

module.exports = AuthMiddleware;
