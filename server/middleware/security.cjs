const rateLimit = require('express-rate-limit');

// 通用速率限制
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 100 个请求
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录速率限制（更严格）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 限制每个 IP 5 次登录尝试
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

// 注册速率限制
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 3, // 限制每个 IP 每小时 3 次注册
  message: 'Too many registration attempts, please try again later.',
});

// 上传速率限制
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 20, // 限制每个 IP 20 次上传
  message: 'Too many upload requests, please try again later.',
});

// 文件类型验证
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp'
];

const validateFileType = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, SVG, and BMP images are allowed.' 
    });
  }

  // 额外检查文件扩展名
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const fileExtension = req.file.originalname.toLowerCase().match(/\.[^.]*$/)?.[0];
  
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({ 
      error: 'Invalid file extension.' 
    });
  }

  next();
};

// 安全的 CORS 配置
const getCorsOptions = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

  return {
    origin: (origin, callback) => {
      // 允许没有 origin 的请求（比如 Postman）
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
};

module.exports = {
  generalLimiter,
  loginLimiter,
  registerLimiter,
  uploadLimiter,
  validateFileType,
  getCorsOptions
};