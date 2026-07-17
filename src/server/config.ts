export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 3000),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  demoMode: process.env.DEMO_MODE !== 'false',
};
