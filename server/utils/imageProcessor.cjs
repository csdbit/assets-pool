const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// 图片尺寸配置
const IMAGE_SIZES = {
  small: { width: 300, height: 300 },
  medium: { width: 800, height: 800 },
  large: { width: 1920, height: 1920 }
};

// 图片质量配置
const QUALITY_SETTINGS = {
  jpeg: 85,
  png: 90,
  webp: 85
};

/**
 * 处理上传的图片，生成多个尺寸版本
 * @param {string} inputPath - 原始图片路径
 * @param {string} outputDir - 输出目录
 * @param {string} baseFilename - 基础文件名（不含扩展名）
 * @returns {Promise<Object>} 处理结果
 */
async function processImage(inputPath, outputDir, baseFilename) {
  try {
    // 获取图片元数据
    const metadata = await sharp(inputPath).metadata();
    
    const results = {
      original: {
        filename: `${baseFilename}${path.extname(inputPath)}`,
        width: metadata.width,
        height: metadata.height,
        size: (await fs.stat(inputPath)).size
      },
      versions: []
    };

    // 为每个尺寸生成图片
    for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
      // 如果原图小于目标尺寸，跳过
      if (metadata.width <= dimensions.width && metadata.height <= dimensions.height) {
        continue;
      }

      const outputFilename = `${sizeName}-${baseFilename}.webp`;
      const outputPath = path.join(outputDir, outputFilename);

      // 处理图片
      const processedImage = await sharp(inputPath)
        .resize(dimensions.width, dimensions.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: QUALITY_SETTINGS.webp })
        .toFile(outputPath);

      results.versions.push({
        type: sizeName.toUpperCase(),
        filename: outputFilename,
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size
      });
    }

    return results;
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * 优化原始图片（压缩但保持原始尺寸）
 * @param {string} inputPath - 原始图片路径
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {Promise<void>}
 */
async function optimizeOriginal(inputPath, maxSize = 5 * 1024 * 1024) {
  try {
    const stats = await fs.stat(inputPath);
    
    // 如果文件大小超过限制，进行压缩
    if (stats.size > maxSize) {
      const metadata = await sharp(inputPath).metadata();
      const format = metadata.format;
      
      let quality = QUALITY_SETTINGS[format] || 85;
      
      // 根据文件大小动态调整质量
      if (stats.size > maxSize * 2) {
        quality = Math.max(70, quality - 15);
      }

      const tempPath = `${inputPath}.temp`;
      
      await sharp(inputPath)
        .jpeg({ quality: format === 'jpeg' ? quality : undefined })
        .png({ quality: format === 'png' ? quality : undefined })
        .webp({ quality: format === 'webp' ? quality : undefined })
        .toFile(tempPath);

      // 替换原文件
      await fs.unlink(inputPath);
      await fs.rename(tempPath, inputPath);
    }
  } catch (error) {
    console.error('Image optimization error:', error);
    // 不抛出错误，允许继续使用原图
  }
}

/**
 * 获取图片的主色调
 * @param {string} imagePath - 图片路径
 * @returns {Promise<string>} 主色调的十六进制值
 */
async function getDominantColor(imagePath) {
  try {
    const { dominant } = await sharp(imagePath)
      .resize(50, 50) // 缩小以加快处理速度
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        // 简单的主色调算法
        let r = 0, g = 0, b = 0;
        const pixelCount = info.width * info.height;
        
        for (let i = 0; i < data.length; i += info.channels) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);
        
        return {
          dominant: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
        };
      });

    return dominant;
  } catch (error) {
    console.error('Get dominant color error:', error);
    return '#808080'; // 默认灰色
  }
}

module.exports = {
  processImage,
  optimizeOriginal,
  getDominantColor,
  IMAGE_SIZES,
  QUALITY_SETTINGS
};