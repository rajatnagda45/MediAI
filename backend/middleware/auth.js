const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  try {
    const tokenPart = token.replace('Bearer ', '');
    const decoded = jwt.verify(tokenPart, process.env.JWT_SECRET || 'secret123');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ success: false, message: 'Invalid token.' });
  }
};
