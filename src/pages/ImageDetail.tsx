import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useImageStore } from '../store/imageStore';
import {
  ArrowLeft,
  Download,
  Share2,
  Copy,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  FileImage,
  Palette,
  Link as LinkIcon,
  ExternalLink,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const ImageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { images, currentImage, fetchImage, updateImage, deleteImage } = useImageStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    password: '',
    expiresAt: '',
    allowDownload: true
  });
  
  // 首先尝试从当前图片获取，如果没有则从图片列表中查找
  const image = currentImage?.id === id ? currentImage : images.find(img => img.id === id);
  const [editData, setEditData] = useState({
    title: image?.title || '',
    description: image?.description || '',
    tags: image?.tags?.map(tag => typeof tag === 'string' ? tag : tag.name).join(', ') || ''
  });

  // 获取图片详情（包括versions）
  useEffect(() => {
    if (id) {
      fetchImage(id);
    }
  }, [id, fetchImage]);

  useEffect(() => {
    if (image) {
      setEditData({
        title: image.title,
        description: image.description || '',
        tags: image.tags?.join(', ') || ''
      });
    }
  }, [image]);

  if (!image) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">图片未找到</h1>
            <p className="text-gray-600 mb-8">您要查看的图片不存在或已被删除。</p>
            <Button onClick={() => navigate('/gallery')}>返回图片库</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSave = () => {
    updateImage(image.id, {
      ...image,
      title: editData.title,
      description: editData.description,
      tags: editData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
    setIsEditing(false);
    toast.success('图片信息已更新');
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这张图片吗？此操作不可撤销。')) {
      deleteImage(image.id);
      toast.success('图片已删除');
      navigate('/gallery');
    }
  };

  const handleCopyUrl = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    toast.success(`${type}链接已复制到剪贴板`);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('开始下载图片');
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '未知时间';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '未知时间';
      }
      return dateObj.toLocaleString('zh-CN');
    } catch (error) {
      return '未知时间';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const shareId = Math.random().toString(36).substr(2, 9);
    return `${baseUrl}/share/${shareId}`;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => {
              // 根据当前路径判断返回位置
              const currentPath = window.location.pathname;
              if (currentPath.startsWith('/gallery/')) {
                navigate('/gallery');
              } else {
                navigate(-1); // 返回上一页
              }
            }}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {window.location.pathname.startsWith('/gallery/') ? '返回图片库' : '返回'}
            </span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
            
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                编辑
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 图片展示区域 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                  
                  {/* 图片信息覆盖层 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="text-white">
                      <h1 className="text-xl font-bold mb-1">{image.title}</h1>
                      {image.description && (
                        <p className="text-sm opacity-90">{image.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* 浏览量 */}
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{image.views || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 链接管理 - 移到图片下方 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  <span>链接管理</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 如果有版本信息，显示各个版本 */}
                  {image.versions && image.versions.length > 0 ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        图片链接（点击复制）
                      </label>
                      <div className="space-y-3">
                        {image.versions
                          .sort((a, b) => {
                            // 按照 ORIGINAL > LARGE > MEDIUM > SMALL 排序
                            const order = { ORIGINAL: 0, LARGE: 1, MEDIUM: 2, SMALL: 3 };
                            return (order[a.type] || 999) - (order[b.type] || 999);
                          })
                          .map((version) => {
                            const labels = {
                              ORIGINAL: '原图',
                              LARGE: '大图 (1920px)',
                              MEDIUM: '中图 (800px)',
                              SMALL: '小图 (300px)'
                            };
                            return (
                              <div key={version.id}>
                                <label className="text-xs text-gray-600 mb-1 block">
                                  {labels[version.type]} - {version.width}×{version.height} - {formatFileSize(parseInt(version.size))}
                                </label>
                                <div className="flex space-x-2">
                                  <Input
                                    value={version.url}
                                    readOnly
                                    className="text-xs font-mono flex-1 min-w-0"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyUrl(version.url, labels[version.type])}
                                    className="flex-shrink-0"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(version.url, '_blank')}
                                    className="flex-shrink-0"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    /* 兼容旧数据：没有版本信息时显示原图链接 */
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        原图链接
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={image.url}
                          readOnly
                          className="text-xs font-mono flex-1 min-w-0"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyUrl(image.url, '原图')}
                          className="flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 信息面板 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileImage className="w-5 h-5 text-blue-600" />
                  <span>图片信息</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标题
                    </label>
                    {isEditing ? (
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        placeholder="图片标题"
                      />
                    ) : (
                      <p className="text-gray-900">{image.title}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      描述
                    </label>
                    {isEditing ? (
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="图片描述"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {image.description || '暂无描述'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标签
                    </label>
                    {isEditing ? (
                      <Input
                        value={editData.tags}
                        onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                        placeholder="标签，用逗号分隔"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {image.tags && image.tags.length > 0 ? (
                          image.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">暂无标签</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 技术信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  <span>技术信息</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">文件名</span>
                    <span className="font-medium">{image.filename}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">文件大小</span>
                    <span className="font-medium">{formatFileSize(image.size)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">尺寸</span>
                    <span className="font-medium">{image.width} × {image.height}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">格式</span>
                    <span className="font-medium uppercase">{image.format}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">上传时间</span>
                    <span className="font-medium">{formatDate(image.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>

        {/* 分享模态框 */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">分享图片</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分享链接
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={generateShareUrl()}
                      readOnly
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleCopyUrl(generateShareUrl(), '分享')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    访问密码（可选）
                  </label>
                  <Input
                    type="password"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })}
                    placeholder="留空表示无需密码"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有效期（可选）
                  </label>
                  <Input
                    type="datetime-local"
                    value={shareSettings.expiresAt}
                    onChange={(e) => setShareSettings({ ...shareSettings, expiresAt: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowDownload"
                    checked={shareSettings.allowDownload}
                    onChange={(e) => setShareSettings({ ...shareSettings, allowDownload: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="allowDownload" className="text-sm text-gray-700">
                    允许下载原图
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowShareModal(false)}
                  >
                    取消
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      toast.success('分享设置已保存');
                      setShowShareModal(false);
                    }}
                  >
                    确认分享
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};