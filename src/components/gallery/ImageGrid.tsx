import React, { useState } from 'react';
import { Image } from '../../store/imageStore';
import { 
  MoreVertical, 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  Eye,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface ImageGridProps {
  images: Image[];
  selectedImages: string[];
  onImageSelect: (id: string) => void;
  onImageClick: (image: Image) => void;
  onImageEdit: (image: Image) => void;
  onImageDelete: (image: Image) => void;
  onImageShare: (image: Image) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedImages,
  onImageSelect,
  onImageClick,
  onImageEdit,
  onImageDelete,
  onImageShare
}) => {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleCopyUrl = (image: Image) => {
    const url = image.url || '';
    navigator.clipboard.writeText(url);
    toast.success('图片链接已复制到剪贴板');
    setShowDropdown(null);
  };
  
  const handleDownload = (image: Image) => {
    const url = image.url || '';
    const link = document.createElement('a');
    link.href = url;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('图片下载已开始');
  };
  
  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
        <p className="text-gray-500 mb-4">您还没有上传任何图片</p>
        <Button onClick={() => window.location.href = '/upload'}>
          立即上传
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image) => {
        const isSelected = selectedImages.includes(image.id);
        const isHovered = hoveredImage === image.id;
        const thumbnailUrl = image.thumbnails?.medium || image.url || '';
        
        return (
          <div
            key={image.id}
            className={clsx(
              'relative group bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer',
              isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            )}
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onImageSelect(image.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Actions Dropdown */}
            <div className="absolute top-2 right-2 z-10">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(showDropdown === image.id ? null : image.id);
                  }}
                  className={clsx(
                    'w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center transition-opacity',
                    isHovered || showDropdown === image.id ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
                
                {showDropdown === image.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        onImageClick(image);
                        setShowDropdown(null);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Eye className="w-4 h-4" />
                      <span>查看详情</span>
                    </button>
                    <button
                      onClick={() => handleCopyUrl(image)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Copy className="w-4 h-4" />
                      <span>复制链接</span>
                    </button>
                    <button
                      onClick={() => handleDownload(image)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Download className="w-4 h-4" />
                      <span>下载</span>
                    </button>
                    <button
                      onClick={() => {
                        onImageShare(image);
                        setShowDropdown(null);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>分享</span>
                    </button>
                    <button
                      onClick={() => {
                        onImageEdit(image);
                        setShowDropdown(null);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Edit className="w-4 h-4" />
                      <span>编辑</span>
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        onImageDelete(image);
                        setShowDropdown(null);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>删除</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Image */}
            <div 
              className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden"
              onClick={() => onImageClick(image)}
            >
              <img
                src={thumbnailUrl}
                alt={image.filename}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            
            {/* Image Info */}
            <div className="p-3">
              <h3 
                className="font-medium text-gray-900 truncate mb-1" 
                title={image.filename}
              >
                {image.filename}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatFileSize(image.size)}</span>
                <span>{formatDate(image.createdAt)}</span>
              </div>
              {image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {image.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {image.tags.length > 2 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{image.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Hover Overlay */}
            {isHovered && (
              <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 rounded-lg" />
            )}
          </div>
        );
      })}
    </div>
  );
};