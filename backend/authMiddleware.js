import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// middleware för att autentisera token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // budfågeln med token

  if (!token) {
    return res.status(401).json({ message: 'Ingen token tillhandahållen.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Ogiltig token.' });
    }
    req.user = user; // innehåller userId och role
    next();
  });
};

//  för att kontrollera roller
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Åtkomst nekad.' });
    }
    next();
  };
};
