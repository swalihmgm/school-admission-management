export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_admission',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    simulatorEnabled: process.env.PAYMENT_SIMULATOR_ENABLED === 'true',
  },
  admin: {
    fullName: process.env.ADMIN_FULL_NAME || 'Admission Team Admin',
    email: process.env.ADMIN_EMAIL || 'admin@school.com',
    password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
  },
});
