const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('./middleware/auth.cjs');

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有系统设置
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsObj = {};
    
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
            value = null;
          }
          break;
        default:
          // string类型保持原样
          break;
      }
      
      settingsObj[setting.key] = value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({ error: '获取系统设置失败' });
  }
});

// 更新系统设置
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      let stringValue = String(value);
      let type = 'string';
      
      // 确定类型
      if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'object' && value !== null) {
        type = 'json';
        stringValue = JSON.stringify(value);
      }
      
      await prisma.systemSetting.upsert({
        where: { key },
        update: {
          value: stringValue,
          type
        },
        create: {
          key,
          value: stringValue,
          type
        }
      });
    }
    
    res.json({ message: '系统设置更新成功' });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    res.status(500).json({ error: '更新系统设置失败' });
  }
});

// 获取单个设置
router.get('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: '设置不存在' });
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
          value = null;
        }
        break;
    }
    
    res.json({ key: setting.key, value });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// 初始化默认设置
router.post('/init', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const defaultSettings = [
      { key: 'allowRegistration', value: 'true', type: 'boolean' },
      { key: 'defaultStorageLimit', value: '1073741824', type: 'number' }, // 1GB
      { key: 'maxFileSize', value: '10485760', type: 'number' }, // 10MB
      { key: 'autoGenerateThumbnails', value: 'true', type: 'boolean' },
      { key: 'addWatermark', value: 'false', type: 'boolean' },
      { key: 'autoCompress', value: 'true', type: 'boolean' },
      { key: 'requireLoginToUpload', value: 'true', type: 'boolean' },
      { key: 'enableHotlinkProtection', value: 'false', type: 'boolean' },
      { key: 'enableContentFilter', value: 'false', type: 'boolean' }
    ];
    
    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      });
    }
    
    res.json({ message: '默认设置初始化成功' });
  } catch (error) {
    console.error('初始化设置失败:', error);
    res.status(500).json({ error: '初始化设置失败' });
  }
});

module.exports = router;