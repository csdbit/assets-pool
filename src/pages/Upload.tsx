import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ImageUpload } from '../components/upload/ImageUpload';
import { useImageStore } from '../store/imageStore';
import { Upload as UploadIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { uploadProgress } = useImageStore();
  
  const handleUploadComplete = () => {
    // 可以选择跳转到图片管理页面
    // navigate('/gallery');
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <UploadIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">图片上传</h1>
          </div>
          <p className="text-gray-600">
            上传您的图片，系统会自动生成多种尺寸版本以适应不同使用场景
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>选择图片</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload onUploadComplete={handleUploadComplete} />
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">上传进度</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadProgress.map((progress) => (
                      <div key={progress.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1 mr-2" title={progress.file.name}>
                            {progress.file.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            {progress.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {progress.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {progress.progress}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.status === 'completed'
                                ? 'bg-green-500'
                                : progress.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                        {progress.error && (
                          <p className="text-xs text-red-600">{progress.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/gallery')}
                  >
                    查看我的图片
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/profile')}
                  >
                    存储空间管理
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Upload Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">上传说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">支持格式</h4>
                    <p>JPG、PNG、GIF、WebP</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">文件大小</h4>
                    <p>单张图片最大 20MB</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">批量上传</h4>
                    <p>最多同时上传 20 张图片</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">自动处理</h4>
                    <p>系统会自动生成原图、大图(1920px)、中图(800px)、小图(300px)四种尺寸</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};