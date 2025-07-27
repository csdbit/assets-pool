const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();
const prisma = new PrismaClient();

// 获取公共系统设置（不需要认证）
router.get('/public', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['allowUserRegistration', 'siteName', 'siteDescription']
        }
      }
    });

    // 转换为对象格式
    const settingsObject = {};
    settings.forEach(setting => {
      if (setting.type === 'boolean') {
        settingsObject[setting.key] = setting.value === 'true';
      } else {
        settingsObject[setting.key] = setting.value;
      }
    });

    // 默认值
    const defaultSettings = {
      allowUserRegistration: true,
      siteName: '图床系统',
      siteDescription: '专业的图片托管服务'
    };

    res.json({
      ...defaultSettings,
      ...settingsObject
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Failed to get public settings' });
  }
});

// 获取系统设置
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    // 转换为键值对格式
    const settingsMap = {};
    settings.forEach(setting => {
      let value = setting.value;
      
      // 根据类型转换值
      switch (setting.type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = setting.value;
          }
          break;
        default:
          // string类型保持原样
          break;
      }
      
      settingsMap[setting.key] = value;
    });
    
    res.json(settingsMap);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新系统设置（仅管理员）
router.put('/', authenticateToken, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const settings = req.body;
    
    // 批量更新设置
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      let stringValue = value;
      let type = 'string';
      
      // 确定类型并转换值
      if (typeof value === 'boolean') {
        type = 'boolean';
        stringValue = value.toString();
      } else if (typeof value === 'number') {
        type = 'number';
        stringValue = value.toString();
      } else if (typeof value === 'object') {
        type = 'json';
        stringValue = JSON.stringify(value);
      }
      
      return prisma.systemSetting.upsert({
        where: { key },
        update: {
          value: stringValue,
          type,
          updatedAt: new Date()
        },
        create: {
          key,
          value: stringValue,
          type
        }
      });
    });
    
    await Promise.all(updatePromises);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取单个设置
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    let value = setting.value;
    
    // 根据类型转换值
    switch (setting.type) {
      case 'boolean':
        value = value === 'true';
        break;
      case 'number':
        value = parseFloat(value);
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = setting.value;
        }
        break;
    }
    
    res.json({ [key]: value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 初始化默认设置
router.post('/init', authenticateToken, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const defaultSettings = [
      { key: 'allowUserRegistration', value: 'true', type: 'boolean' },
      { key: 'defaultStorageLimit', value: '1073741824', type: 'number' }, // 1GB
      { key: 'maxFileSize', value: '10485760', type: 'number' }, // 10MB
      { key: 'autoGenerateThumbnails', value: 'true', type: 'boolean' },
      { key: 'enableWatermark', value: 'false', type: 'boolean' },
      { key: 'autoCompress', value: 'true', type: 'boolean' },
      { key: 'requireLoginToUpload', value: 'true', type: 'boolean' },
      { key: 'enableHotlinkProtection', value: 'false', type: 'boolean' },
      { key: 'enableContentFilter', value: 'true', type: 'boolean' }
    ];
    
    const initPromises = defaultSettings.map(setting => 
      prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
    );
    
    await Promise.all(initPromises);
    
    res.json({ message: 'Default settings initialized successfully' });
  } catch (error) {
    console.error('Init settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;