const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

const router = express.Router();
const prisma = new PrismaClient();

// 获取当前用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        role: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            images: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        ...user,
        storageUsed: user.storageUsed.toString(),
        storageLimit: user.storageLimit.toString(),
        imageCount: user._count.images
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, bio } = req.body;
    console.log('更新用户信息请求:', { userId: req.user.id, username, email, bio });

    // 验证输入
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // 检查用户名和邮箱是否已被其他用户使用
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: req.user.id } },
          {
            OR: [
              { email },
              { username }
            ]
          }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already exists' : 'Username already exists' 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { username, email, bio },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        role: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('数据库更新成功:', updatedUser);

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        storageUsed: updatedUser.storageUsed.toString(),
        storageLimit: updatedUser.storageLimit.toString()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // 获取用户当前密码
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// 获取用户统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [imageStats, storageStats] = await Promise.all([
      prisma.image.groupBy({
        by: ['createdAt'],
        where: { userId: req.user.id },
        _count: { id: true },
        _sum: { size: true }
      }),
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          storageUsed: true,
          storageLimit: true,
          _count: {
            select: {
              images: true
            }
          }
        }
      })
    ]);

    // 计算最近30天的上传统计
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentImages = await prisma.image.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        size: true
      }
    });

    res.json({
      totalImages: storageStats._count.images,
      storageUsed: storageStats.storageUsed.toString(),
      storageLimit: storageStats.storageLimit.toString(),
      storagePercentage: Number((storageStats.storageUsed * BigInt(100)) / storageStats.storageLimit),
      recentUploads: recentImages.length,
      recentStorage: recentImages.reduce((sum, img) => sum + Number(img.size), 0)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 管理员：获取系统统计信息
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 获取总用户数
    const totalUsers = await prisma.user.count();
    
    // 获取活跃用户数（最近30天创建的用户作为活跃用户的替代指标）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    // 获取总图片数
    const totalImages = await prisma.image.count();
    
    // 获取总存储使用量
    const storageStats = await prisma.user.aggregate({
      _sum: {
        storageUsed: true
      }
    });
    
    // 获取最近注册的用户
    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        role: true
      }
    });
    
    // 获取最近上传的图片
    const recentImages = await prisma.image.findMany({
      orderBy: {
        uploadedAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        filename: true,
        size: true,
        uploadedAt: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });
    
    // 获取系统最大存储容量（所有用户的存储限制总和）
    const maxStorageStats = await prisma.user.aggregate({
      _sum: {
        storageLimit: true
      }
    });
    
    res.json({
      totalUsers,
      activeUsers,
      totalImages,
      totalStorage: storageStats._sum.storageUsed?.toString() || '0',
      maxSystemStorage: maxStorageStats._sum.storageLimit?.toString() || '10737418240', // 默认10GB
      recentUsers,
      recentImages: recentImages.map(img => ({
        ...img,
        size: img.size.toString()
      }))
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// 管理员：获取所有用户列表
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          storageUsed: true,
          storageLimit: true,
          createdAt: true,
          _count: {
            select: {
              images: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers = users.map(user => ({
      ...user,
      storageUsed: user.storageUsed.toString(),
      storageLimit: user.storageLimit.toString(),
      imageCount: user._count.images
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 管理员：更新用户角色
router.put('/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
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

    res.json({
      message: 'User role updated successfully',
      user: {
        ...updatedUser,
        storageUsed: updatedUser.storageUsed.toString(),
        storageLimit: updatedUser.storageLimit.toString()
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// 管理员：激活/暂停用户
router.put('/admin/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 检查是否尝试暂停自己
    if (req.params.id === req.user.id && status === 'SUSPENDED') {
      return res.status(400).json({ error: 'Cannot suspend yourself' });
    }

    // 更新用户状态
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        storageUsed: true,
        storageLimit: true,
        createdAt: true
      }
    });

    res.json({
      message: `User ${status === 'ACTIVE' ? 'activated' : 'suspended'} successfully`,
      user: {
        ...updatedUser,
        storageUsed: updatedUser.storageUsed.toString(),
        storageLimit: updatedUser.storageLimit.toString()
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// 管理员：删除用户
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 检查是否尝试删除自己
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        images: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 删除用户的所有图片文件
    const fs = require('fs');
    const path = require('path');
    
    for (const image of user.images) {
      try {
        // 删除原图
        const originalPath = path.join(__dirname, '../uploads', image.filename);
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        // 删除缩略图
        const thumbnailPath = path.join(__dirname, '../uploads', `small-${image.filename}`);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }

        // 删除中等尺寸图片
        const mediumPath = path.join(__dirname, '../uploads', `medium-${image.filename}`);
        if (fs.existsSync(mediumPath)) {
          fs.unlinkSync(mediumPath);
        }

        // 删除大尺寸图片
        const largePath = path.join(__dirname, '../uploads', `large-${image.filename}`);
        if (fs.existsSync(largePath)) {
          fs.unlinkSync(largePath);
        }
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
      }
    }

    // 删除用户（级联删除图片记录）
    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;