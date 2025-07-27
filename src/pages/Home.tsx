import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSystemStore } from '../store/systemStore';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ImageUpload } from '../components/upload/ImageUpload';
import { 
  Upload, 
  Images, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { settings } = useSystemStore();
  const navigate = useNavigate();
  
  console.log('Home页面 - 系统设置:', settings);
  console.log('Home页面 - 允许注册:', settings?.allowUserRegistration);
  
  if (isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              欢迎回来，{user?.username}！
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              开始上传和管理您的图片资源
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Upload */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span>快速上传</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload 
                    maxFiles={5} 
                    onUploadComplete={() => navigate('/gallery')}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>快速操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link to="/gallery" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Images className="w-4 h-4 mr-2" />
                        查看我的图片
                      </Button>
                    </Link>
                    <Link to="/upload" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="w-4 h-4 mr-2" />
                        批量上传
                      </Button>
                    </Link>
                    <Link to="/profile" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        个人中心
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              {/* Storage Info */}
              <Card>
                <CardHeader>
                  <CardTitle>存储使用情况</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>已使用</span>
                      <span>{((user?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${((user?.storageUsed || 0) / (user?.storageLimit || 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>总容量</span>
                      <span>{((user?.storageLimit || 0) / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // 未登录用户看到的首页
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <img src="/image-logo.png" alt="图床系统" className="w-8 h-8" />
                <span className="text-xl font-bold text-gray-900">图床系统</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">登录</Button>
              </Link>
              {settings?.allowUserRegistration && (
                <Link to="/register">
                  <Button>注册</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            专业的
            <span className="text-blue-600">图片托管</span>
            服务
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            为个人用户、开发者和内容创作者提供稳定可靠的图片存储、管理和分享服务。
            自动生成多种尺寸，优化加载性能。
          </p>
        </div>
      </div>
      
      {/* Features */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">核心功能</h2>
          <p className="text-lg text-gray-600">为您提供完整的图片管理解决方案</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">自动处理</h3>
              <p className="text-gray-600">
                上传后自动生成原图、大图、中图、小图四种尺寸，满足不同场景需求
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">安全可靠</h3>
              <p className="text-gray-600">
                HTTPS传输加密，防盗链保护，定期备份，确保您的图片资源安全
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">便捷分享</h3>
              <p className="text-gray-600">
                一键生成分享链接，支持设置访问密码和有效期，灵活控制访问权限
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/image-logo.png" alt="图床系统" className="w-6 h-6" />
            <span className="text-lg font-semibold">图床系统</span>
          </div>
          <p className="text-gray-400">
            © 2025 图床系统. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  );
};