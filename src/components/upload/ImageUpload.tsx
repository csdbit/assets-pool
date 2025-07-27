import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useImageStore } from '../../store/imageStore';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface UploadFile extends File {
  id: string;
  preview?: string;
}

interface ImageUploadProps {
  maxFiles?: number;
  maxSize?: number; // in bytes
  onUploadComplete?: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  maxFiles = 20,
  maxSize = 20 * 1024 * 1024, // 20MB
  onUploadComplete
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { addUploadProgress, updateUploadProgress, removeUploadProgress, addImage } = useImageStore();
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((file) => {
      file.errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast.error(`文件 ${file.file.name} 太大，最大支持 ${maxSize / 1024 / 1024}MB`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`文件 ${file.file.name} 格式不支持`);
        }
      });
    });
    
    // Handle accepted files
    const newFiles = acceptedFiles.map(file => {
      const uploadFile = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9),
        preview: URL.createObjectURL(file)
      }) as UploadFile;
      return uploadFile;
    });
    
    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      if (combined.length > maxFiles) {
        toast.error(`最多只能上传 ${maxFiles} 张图片`);
        return prev;
      }
      return combined;
    });
  }, [maxFiles, maxSize]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize,
    multiple: true
  });
  
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };
  
  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('请先选择要上传的图片');
      return;
    }
    
    setUploading(true);
    
    try {
      for (const file of files) {
        // Add to upload progress
        addUploadProgress({
          id: file.id,
          file,
          progress: 0,
          status: 'uploading'
        });
        
        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append('image', file);
          formData.append('title', file.name.split('.')[0]);
          formData.append('description', '');
          formData.append('tags', JSON.stringify([]));
          formData.append('isPublic', 'false');
          
          // Upload using API client
          const { default: apiClient } = await import('../../lib/api');
          
          // Track upload progress (simplified since we can't track real progress with fetch)
          updateUploadProgress(file.id, { progress: 50 });
          
          const response = await apiClient.uploadImage(formData);
          
          updateUploadProgress(file.id, { progress: 100, status: 'completed' });
          
          // Add the uploaded image to store
          if (response.image) {
            addImage(response.image);
          }
          
          // Remove from progress after a delay
          setTimeout(() => {
            removeUploadProgress(file.id);
          }, 2000);
        } catch (error) {
          console.error('Upload error:', error);
          updateUploadProgress(file.id, { 
            status: 'error', 
            error: error instanceof Error ? error.message : '上传失败' 
          });
          throw error;
        }
      }
      
      toast.success(`成功上传 ${files.length} 张图片`);
      
      // Clean up preview URLs
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      setFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? '释放文件开始上传' : '拖拽图片到这里，或点击选择文件'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              支持 JPG、PNG、GIF、WebP 格式，单张图片最大 {maxSize / 1024 / 1024}MB
            </p>
          </div>
        </div>
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              已选择 {files.length} 张图片
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                files.forEach(file => {
                  if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                  }
                });
                setFiles([]);
              }}
            >
              清空
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="mt-1 text-xs text-gray-600 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={uploadFiles}
              loading={uploading}
              disabled={files.length === 0}
              size="lg"
            >
              上传 {files.length} 张图片
            </Button>
          </div>
        </div>
      )}
      
      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">上传提示：</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 系统会自动生成多种尺寸的图片版本</li>
              <li>• 支持批量上传，最多 {maxFiles} 张</li>
              <li>• 建议上传高质量图片以获得更好的显示效果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};