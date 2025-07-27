const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        role: true,
        status: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    // Convert BigInt to string for JSON serialization
    const { storageUsed, storageLimit, ...userWithoutBigInt } = user;
    req.user = {
      ...userWithoutBigInt,
      storageUsed: storageUsed.toString(),
      storageLimit: storageLimit.toString()
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};