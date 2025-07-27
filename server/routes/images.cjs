const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

const router = express.Router();
const prisma = new PrismaClient();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// 配置 multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// 获取用户的图片列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tag } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(tag && {
        tags: {
          some: {
            name: { contains: tag, mode: 'insensitive' }
          }
        }
      })
    };

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        include: {
          tags: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          shares: {
            where: { expiresAt: { gt: new Date() } },
            take: 1
          }
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.image.count({ where })
    ]);

    const formattedImages = images.map(image => ({
      ...image,
      size: image.size.toString(),
      url: `http://localhost:${process.env.PORT || 3001}${image.url}`,
      versions: image.versions.map(v => ({
        ...v,
        size: v.size.toString(),
        url: `http://localhost:${process.env.PORT || 3001}${v.url}`
      }))
    }));

    res.json({
      images: formattedImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// 上传图片
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    await ensureUploadDir();

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { title, description, tags = '[]', isPublic = false } = req.body;
    const parsedTags = JSON.parse(tags);

    // 生成唯一文件名
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // 处理原图
    const imageBuffer = await sharp(req.file.buffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    // 保存原图
    await fs.writeFile(filePath, imageBuffer);

    // 获取图片信息
    const metadata = await sharp(imageBuffer).metadata();
    const fileSize = imageBuffer.length;

    // 生成不同尺寸的图片版本
    const versions = [
      { type: 'ORIGINAL', width: null, filename: fileName, path: filePath },
      { type: 'LARGE', width: 1920, filename: `large-${fileName}` },
      { type: 'MEDIUM', width: 800, filename: `medium-${fileName}` },
      { type: 'SMALL', width: 300, filename: `small-${fileName}` }
    ];

    const versionData = [];
    let totalSize = BigInt(fileSize);

    // 生成各个版本（跳过原图）
    for (const version of versions.slice(1)) {
      const versionPath = path.join(uploadDir, version.filename);
      
      // 只有当原图宽度大于目标宽度时才调整大小
      if (metadata.width && metadata.width > version.width) {
        const versionBuffer = await sharp(req.file.buffer)
          .resize(version.width, null, { 
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        await fs.writeFile(versionPath, versionBuffer);
        const versionMetadata = await sharp(versionBuffer).metadata();
        
        versionData.push({
          type: version.type,
          filename: version.filename,
          path: versionPath,
          size: BigInt(versionBuffer.length),
          width: versionMetadata.width,
          height: versionMetadata.height,
          url: `/uploads/${version.filename}`
        });
        
        totalSize += BigInt(versionBuffer.length);
      } else {
        // 如果原图小于目标尺寸，复制原图
        await fs.copyFile(filePath, versionPath);
        
        versionData.push({
          type: version.type,
          filename: version.filename,
          path: versionPath,
          size: BigInt(fileSize),
          width: metadata.width,
          height: metadata.height,
          url: `/uploads/${version.filename}`
        });
        
        totalSize += BigInt(fileSize);
      }
    }

    // 检查用户存储限制
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.storageUsed + totalSize > user.storageLimit) {
      // 删除已上传的文件
      await fs.unlink(filePath);
      for (const version of versionData) {
        await fs.unlink(version.path).catch(() => {});
      }
      return res.status(400).json({ error: 'Storage limit exceeded' });
    }

    // 创建图片记录
    const image = await prisma.image.create({
      data: {
        title: title || req.file.originalname,
        description,
        filename: fileName,
        originalName: req.file.originalname,
        mimeType: 'image/jpeg',
        size: BigInt(fileSize),
        width: metadata.width,
        height: metadata.height,
        url: `/uploads/${fileName}`,
        isPublic: Boolean(isPublic),
        userId: req.user.id,
        tags: {
          connectOrCreate: parsedTags.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName }
          }))
        },
        versions: {
          create: [
            // 原图版本
            {
              type: 'ORIGINAL',
              filename: fileName,
              size: BigInt(fileSize),
              width: metadata.width,
              height: metadata.height,
              url: `/uploads/${fileName}`
            },
            // 其他版本
            ...versionData.map(v => ({
              type: v.type,
              filename: v.filename,
              size: v.size,
              width: v.width,
              height: v.height,
              url: v.url
            }))
          ]
        }
      },
      include: {
        tags: true,
        versions: true
      }
    });

    // 更新用户存储使用量
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        storageUsed: {
          increment: totalSize
        }
      }
    });

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        ...image,
        size: image.size.toString(),
        url: `http://localhost:${process.env.PORT || 3001}${image.url}`,
        versions: image.versions.map(v => ({
          ...v,
          size: v.size.toString(),
          url: `http://localhost:${process.env.PORT || 3001}${v.url}`
        }))
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// 获取所有标签
router.get('/tags/all', authenticateToken, async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// 获取单个图片详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const image = await prisma.image.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      },
      include: {
        tags: true,
        versions: {
          orderBy: { createdAt: 'desc' }
        },
        shares: {
          where: { expiresAt: { gt: new Date() } }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      ...image,
      size: image.size.toString(),
      url: `http://localhost:${process.env.PORT || 3001}${image.url}`,
      versions: image.versions.map(v => ({
        ...v,
        size: v.size.toString(),
        url: `http://localhost:${process.env.PORT || 3001}${v.url}`
      }))
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// 更新图片信息
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, tags = [], isPublic } = req.body;

    const existingImage = await prisma.image.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const updatedImage = await prisma.image.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        isPublic: Boolean(isPublic),
        tags: {
          set: [],
          connectOrCreate: tags.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName }
          }))
        }
      },
      include: {
        tags: true
      }
    });

    res.json({
      message: 'Image updated successfully',
      image: {
        ...updatedImage,
        size: updatedImage.size.toString(),
        url: `http://localhost:${process.env.PORT || 3001}${updatedImage.url}`
      }
    });
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// 删除图片
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const image = await prisma.image.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        versions: true
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // 删除所有版本的文件
    const filesToDelete = [image.filename, ...image.versions.map(v => v.filename)];
    
    for (const filename of filesToDelete) {
      const filePath = path.join(uploadDir, filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete file:', filename, error.message);
      }
    }

    // 删除数据库记录
    await prisma.image.delete({
      where: { id: req.params.id }
    });

    // 更新用户存储使用量
    const totalSize = image.size + image.versions.reduce((sum, v) => sum + v.size, BigInt(0));
    await prisma.user.update({
      where: { id: image.userId },
      data: {
        storageUsed: {
          decrement: totalSize
        }
      }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// 管理员：删除任意图片
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const image = await prisma.image.findUnique({
      where: { id: req.params.id },
      include: {
        versions: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // 删除所有版本的文件
    const filesToDelete = [image.filename, ...image.versions.map(v => v.filename)];
    
    for (const filename of filesToDelete) {
      const filePath = path.join(uploadDir, filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete file:', filename, error.message);
      }
    }

    // 删除数据库记录
    await prisma.image.delete({
      where: { id: req.params.id }
    });

    // 更新用户存储使用量
    const totalSize = image.size + image.versions.reduce((sum, v) => sum + v.size, BigInt(0));
    await prisma.user.update({
      where: { id: image.userId },
      data: {
        storageUsed: {
          decrement: totalSize
        }
      }
    });

    res.json({ message: 'Image deleted successfully by admin' });
  } catch (error) {
    console.error('Admin delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// 隐藏/显示图片
router.put('/:id/hide', authenticateToken, async (req, res) => {
  try {
    const { hidden = true } = req.body;
    
    // 检查权限：用户只能隐藏自己的图片，管理员可以隐藏任意图片
    const whereCondition = req.user.role === 'ADMIN' 
      ? { id: req.params.id }
      : { id: req.params.id, userId: req.user.id };

    const image = await prisma.image.findFirst({
      where: whereCondition
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const updatedImage = await prisma.image.update({
      where: { id: req.params.id },
      data: { isPublic: !hidden },
      include: {
        tags: true,
        versions: true
      }
    });

    res.json({
      message: `Image ${hidden ? 'hidden' : 'shown'} successfully`,
      image: {
        ...updatedImage,
        size: updatedImage.size.toString(),
        url: `http://localhost:${process.env.PORT || 3001}${updatedImage.url}`,
        versions: updatedImage.versions.map(v => ({
          ...v,
          size: v.size.toString(),
          url: `http://localhost:${process.env.PORT || 3001}${v.url}`
        }))
      }
    });
  } catch (error) {
    console.error('Hide image error:', error);
    res.status(500).json({ error: 'Failed to update image visibility' });
  }
});

// 管理员：获取所有图片列表
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereCondition = search ? {
      OR: [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            username: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    } : {};

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          tags: true,
          versions: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.image.count({ where: whereCondition })
    ]);

    const formattedImages = images.map(image => ({
      ...image,
      size: image.size.toString(),
      url: `http://localhost:${process.env.PORT || 3001}${image.url}`,
      versions: image.versions.map(v => ({
        ...v,
        size: v.size.toString(),
        url: `http://localhost:${process.env.PORT || 3001}${v.url}`
      }))
    }));

    res.json({
      images: formattedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin images error:', error);
    res.status(500).json({ error: 'Failed to get images' });
  }
});

module.exports = router;