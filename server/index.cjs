const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

let prisma;

// 延迟初始化 Prisma 客户端
const initPrisma = () => {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
      console.log('✅ Prisma client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Prisma client:', error);
      throw error;
    }
  }
  return prisma;
};

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const prismaClient = initPrisma();
    const user = await prismaClient.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // 转换 BigInt 为字符串
    const { storageUsed, storageLimit, ...userWithoutBigInt } = user;
    req.user = {
      ...userWithoutBigInt,
      storageUsed: storageUsed.toString(),
      storageLimit: storageLimit.toString()
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 引入认证路由
const authRouter = require('./routes/auth.cjs');

// 引入路由
const imagesRouter = require('./routes/images.cjs');
const usersRouter = require('./routes/users.cjs');
const settingsRouter = require('./routes/settings.cjs');

// 使用路由
app.use('/api/auth', authRouter);
app.use('/api/images', imagesRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);

// 404 处理
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;