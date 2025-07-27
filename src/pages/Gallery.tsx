import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ImageGrid } from '../components/gallery/ImageGrid';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useImageStore, Image } from '../store/imageStore';
import { useAuthStore } from '../store/authStore';
import { 
  Search, 
  Grid3X3, 
  List, 
  Upload, 
  Trash2, 
  Share2,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

export const Gallery: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    images,
    isLoading,
    pagination,
    filters,
    fetchImages,
    deleteImage,
    setFilters
  } = useImageStore();
  
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);
  
  // 加载图片数据 - 只有在认证状态确认后才加载
  useEffect(() => {
    if (isAuthenticated) {
      // 延迟一下确保token验证完成
      const timer = setTimeout(() => {
        fetchImages();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchImages]);
  
  // 过滤和排序图片
  const filteredAndSortedImages = React.useMemo(() => {
    let filtered = [...images];
    
    // 搜索过滤
    if (filters.search) {
      filtered = filtered.filter(image => 
        image.filename.toLowerCase().includes(filters.search.toLowerCase()) ||
        (image.title && image.title.toLowerCase().includes(filters.search.toLowerCase())) ||
        (image.description && image.description.toLowerCase().includes(filters.search.toLowerCase())) ||
        (image.tags && image.tags.some(tag => tag.name.toLowerCase().includes(filters.search.toLowerCase())))
      );
    }
    
    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [images, filters.search, sortBy, sortOrder]);
  
  const handleImageClick = (image: Image) => {
    navigate(`/gallery/${image.id}`);
  };
  
  const handleImageEdit = (image: Image) => {
    navigate(`/gallery/${image.id}/edit`);
  };
  
  const handleImageDelete = async (image: Image) => {
    if (window.confirm(`确定要删除图片 "${image.filename}" 吗？`)) {
      const success = await deleteImage(image.id);
      if (success) {
        // 从选中列表中移除
        setSelectedImages(prev => prev.filter(id => id !== image.id));
      }
    }
  };
  
  const handleImageShare = (image: Image) => {
    // 这里可以打开分享对话框
    toast.info('分享功能开发中...');
  };
  
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };
  
  const clearSelection = () => {
    setSelectedImages([]);
  };
  
  const handleBatchDelete = async () => {
    if (selectedImages.length === 0) {
      toast.error('请先选择要删除的图片');
      return;
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedImages.length} 张图片吗？`)) {
      const promises = selectedImages.map(id => deleteImage(id));
      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        clearSelection();
        toast.success(`已删除 ${successCount} 张图片`);
      }
    }
  };
  
  const handleBatchShare = () => {
    if (selectedImages.length === 0) {
      toast.error('请先选择要分享的图片');
      return;
    }
    
    toast.info('批量分享功能开发中...');
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">图片管理</h1>
            <p className="text-gray-600">
              共 {filteredAndSortedImages.length} 张图片
              {selectedImages.length > 0 && (
                <span className="ml-2 text-blue-600">
                  已选择 {selectedImages.length} 张
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => navigate('/upload')}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>上传图片</span>
            </Button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索图片名称、描述或标签..."
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">最新上传</option>
                <option value="date-asc">最早上传</option>
                <option value="name-asc">名称 A-Z</option>
                <option value="name-desc">名称 Z-A</option>
                <option value="size-desc">文件大小 ↓</option>
                <option value="size-asc">文件大小 ↑</option>
              </select>
              
              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'p-2 text-sm',
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'p-2 text-sm',
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Batch Actions */}
          {selectedImages.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                已选择 {selectedImages.length} 张图片
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchShare}
                  className="flex items-center space-x-1"
                >
                  <Share2 className="w-4 h-4" />
                  <span>批量分享</span>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBatchDelete}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>批量删除</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  取消选择
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <ImageGrid
            images={filteredAndSortedImages}
            selectedImages={selectedImages}
            onImageSelect={toggleImageSelection}
            onImageClick={handleImageClick}
            onImageEdit={handleImageEdit}
            onImageDelete={handleImageDelete}
            onImageShare={handleImageShare}
          />
        )}
      </div>
    </Layout>
  );
};