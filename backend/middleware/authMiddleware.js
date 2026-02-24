import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          message: 'Not authorized, user not found',
          code: 'USER_NOT_FOUND'
        });
      }

      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      
      // Provide specific error messages for different JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token. Please log in again.',
          code: 'INVALID_TOKEN'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        message: 'Not authorized, token failed',
        code: 'AUTH_FAILED'
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      message: 'Not authorized, no token',
      code: 'NO_TOKEN'
    });
  }
};
