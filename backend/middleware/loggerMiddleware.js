import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Custom morgan token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'anonymous';
});

// Custom format string
const logFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Development logging (console)
export const devLogger = morgan('dev');

// Production logging (file)
export const prodLogger = morgan(logFormat, { stream: accessLogStream });

// Combined logging for all environments
export const logger = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    prodLogger(req, res, next);
  } else {
    devLogger(req, res, next);
  }
};

// Error logger
export const errorLogger = (err, req, res, next) => {
  const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
  );

  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?._id || 'anonymous',
    error: {
      message: err.message,
      stack: err.stack,
      status: err.status || 500,
    },
  };

  errorLogStream.write(JSON.stringify(errorLog) + '\n');
  next(err);
};
