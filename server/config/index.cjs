require('dotenv').config();

// 验证必需的环境变量
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

const config = {
  // 服务器配置
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // CORS 配置
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
  },

  // 上传配置
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './server/uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp'
    ]
  },

  // 存储限制
  storage: {
    defaultUserLimit: parseInt(process.env.DEFAULT_USER_STORAGE_LIMIT || '1073741824'), // 1GB
    maxUserLimit: parseInt(process.env.MAX_USER_STORAGE_LIMIT || '10737418240') // 10GB
  },

  // 安全配置
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15分钟
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },

  // 前端URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};

module.exports = config;