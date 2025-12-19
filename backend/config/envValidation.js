import dotenv from 'dotenv';

dotenv.config();

// Required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'PORT',
  'NODE_ENV',
  'CLIENT_URL',
];

// Optional but recommended environment variables
const optionalEnvVars = [
  'JWT_EXPIRE',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

export const validateEnv = () => {
  const missingVars = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Throw error if required variables are missing
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  // Validate NODE_ENV
  const validNodeEnvs = ['development', 'production', 'test'];
  if (!validNodeEnvs.includes(process.env.NODE_ENV)) {
    throw new Error(
      `NODE_ENV must be one of: ${validNodeEnvs.join(', ')}. Got: ${process.env.NODE_ENV}`
    );
  }

  // Validate PORT
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  // Log warnings for optional variables
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      '⚠️  Warning: Optional environment variables not set:',
      warnings.join(', ')
    );
    console.warn('   Some features may not work correctly.');
  }

  // Log success
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Environment variables validated successfully');
  }

  return true;
};

// Export configuration object
export const config = {
  port: parseInt(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
