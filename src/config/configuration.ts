export default () => ({
  app: {
    name: process.env.APP_NAME || 'Bakir Khata API',
    url: process.env.APP_URL || 'http://localhost:5001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
  },
  port: parseInt(process.env.PORT ?? '3000', 10),
  timezone: process.env.TZ || 'Asia/Dhaka',
  database: {
    db_uri: process.env.DB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: {
      name: process.env.MAIL_FROM_NAME || 'Bakir Khata',
      address: process.env.MAIL_FROM_ADDRESS || 'example@com',
    },
  },
});
