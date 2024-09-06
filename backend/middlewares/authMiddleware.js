const jwt = require('jsonwebtoken');

const authMiddleware = (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized, Token is not valid' });
    }
};

module.exports = authMiddleware;
