const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();
const prisma = new PrismaClient();

// 测试端点 - 确认代码已更新
router.get('/test-update', (req, res) => {
  res.json({ 
    message: 'Auth route updated with user status check',
    timestamp: new Date().toISOString()
  });
});

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // 检查是否允许用户注册
    const registrationSetting = await prisma.systemSetting.findUnique({
      where: { key: 'allowUserRegistration' }
    });
    
    const allowRegistration = registrationSetting ? registrationSetting.value === 'true' : true;
    
    if (!allowRegistration) {
      return res.status(403).json({ error: 'User registration is currently disabled' });
    }

    // 验证输入
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already exists' : 'Username already exists' 
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        storageLimit: BigInt(1073741824) // 1GB
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true
      }
    });

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        ...user,
        storageUsed: user.storageUsed.toString(),
        storageLimit: user.storageLimit.toString()
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, passwordLength: password?.length });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email } // 允许用户名登录
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        bio: true,
        role: true,
        status: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true
      }
    });

    console.log('User found:', user ? { id: user.id, email: user.email, status: user.status, passwordHash: user.password } : 'No user found');

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      console.log('Login failed: User account is suspended');
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    // 验证密码
    console.log('Comparing password:', { inputPassword: password, storedHash: user.password });
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        storageUsed: user.storageUsed.toString(),
        storageLimit: user.storageLimit.toString()
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 验证 token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    user: {
      ...req.user,
      storageUsed: req.user.storageUsed.toString(),
      storageLimit: req.user.storageLimit.toString()
    }
  });
});

// 刷新 token
router.post('/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  res.json({ token });
});

module.exports = router;