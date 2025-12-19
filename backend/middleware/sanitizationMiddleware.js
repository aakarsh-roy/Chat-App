import mongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';

// Sanitize data to prevent MongoDB injection
export const sanitizeData = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key: ${key} in request from IP: ${req.ip}`);
    },
  });
};

// Prevent XSS attacks by sanitizing user input
export const preventXSS = () => {
  return xss();
};

// Additional validation for specific fields
export const validateInput = (req, res, next) => {
  // Validate email format
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
  }

  // Validate username (alphanumeric, underscore, hyphen only)
  if (req.body.username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(req.body.username)) {
      return res.status(400).json({ 
        message: 'Username must be 3-20 characters and contain only letters, numbers, underscore, or hyphen' 
      });
    }
  }

  // Validate password strength
  if (req.body.password && req.path.includes('register')) {
    const password = req.body.password;
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }
  }

  next();
};

// Trim whitespace from all string inputs
export const trimInputs = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};
