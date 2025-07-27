const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('./middleware/auth.cjs');

const router = express.Router();
const prisma = new PrismaClient();

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // 检查用户名和邮箱是否已被其他用户使用
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: req.user.id }
        }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: '用户名已被使用' });
      }
    }
    
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: req.user.id }
        }
      });
      
      if (existingUser) {
        return res.status(400).json({ error: '邮箱已被使用' });
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username && { username }),
        ...(email && { email })
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '当前密码和新密码都是必需的' });
    }
    
    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '当前密码不正确' });
    }
    
    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });
    
    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

// 获取用户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取用户图片统计
    const imageStats = await prisma.image.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { size: true }
    });
    
    // 获取最近上传的图片
    const recentImages = await prisma.image.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        filename: true,
        size: true,
        createdAt: true
      }
    });
    
    res.json({
      totalImages: imageStats._count.id || 0,
      totalSize: imageStats._sum.size || 0,
      recentImages
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取用户统计失败' });
  }
});

// 管理员获取系统统计
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 获取用户统计
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天内活跃
        }
      }
    });
    
    // 获取图片统计
    const imageStats = await prisma.image.aggregate({
      _count: { id: true },
      _sum: { size: true }
    });
    
    // 获取存储使用统计
    const storageStats = await prisma.user.aggregate({
      _sum: { storageUsed: true, storageLimit: true }
    });
    
    // 获取最近注册用户
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    // 获取最近上传图片
    const recentImages = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        filename: true,
        size: true,
        createdAt: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });
    
    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers
      },
      images: {
        total: imageStats._count.id || 0,
        totalSize: imageStats._sum.size || 0,
        recent: recentImages
      },
      storage: {
        used: storageStats._sum.storageUsed || 0,
        total: storageStats._sum.storageLimit || 0
      }
    });
  } catch (error) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({ error: '获取系统统计失败' });
  }
});

// 管理员获取所有用户列表
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      ...(search && {
        OR: [
          { username: { contains: search } },
          { email: { contains: search } }
        ]
      }),
      ...(role && { role })
    };
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          storageUsed: true,
          storageLimit: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              images: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 管理员更新用户角色
router.put('/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('更新用户角色失败:', error);
    res.status(500).json({ error: '更新用户角色失败' });
  }
});

// 管理员更新用户状态
router.put('/admin/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ error: '更新用户状态失败' });
  }
});

// 管理员删除用户
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // 不能删除自己
    if (userId === req.user.id) {
      return res.status(400).json({ error: '不能删除自己的账户' });
    }
    
    // 先删除用户的所有图片
    await prisma.image.deleteMany({
      where: { userId }
    });
    
    // 然后删除用户
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

module.exports = router;