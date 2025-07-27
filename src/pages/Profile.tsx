import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useImageStore } from '../store/imageStore';
import apiClient from '../lib/api';
import {
  User,
  Shield,
  HardDrive,
  Calendar,
  Settings,
  Camera,
  Download,
  Share2,
  Eye,
  Edit3,
  Save,
  X,
  Lock,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export const Profile: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuthStore();
  const { images } = useImageStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // 添加调试日志
  React.useEffect(() => {
    console.log('Profile页面 - 当前用户信息:', user);
    console.log('Profile页面 - 用户bio:', user?.bio);
  }, [user]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSave = async () => {
    try {
      console.log('保存个人信息，表单数据:', formData);
      console.log('当前用户信息:', user);
      
      const response = await apiClient.updateProfile(formData);
      console.log('API响应:', response);
      
      // 确保更新本地状态
      updateUser(response.user);
      
      // 同时更新表单数据以确保显示最新值
      setFormData({
        username: response.user.username,
        email: response.user.email,
        bio: response.user.bio || ''
      });
      
      setIsEditing(false);
      toast.success('个人信息已更新');
      
      console.log('更新后的用户信息:', response.user);
      console.log('更新后的表单数据:', {
        username: response.user.username,
        email: response.user.email,
        bio: response.user.bio || ''
      });
    } catch (error) {
      console.error('保存个人信息失败:', error);
      toast.error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || ''
    });
    setIsEditing(false);
  };

  const handlePasswordSubmit = async () => {
    // 表单验证
    if (!passwordData.currentPassword) {
      toast.error('请输入当前密码');
      return;
    }
    
    if (!passwordData.newPassword) {
      toast.error('请输入新密码');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('新密码至少需要8个字符');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('新密码不能与当前密码相同');
      return;
    }

    setPasswordLoading(true);
    
    try {
      await apiClient.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('密码修改成功');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
// 计算统计数据
  const totalImages = images.length;
  const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
  const storageUsagePercent = ((user?.storageUsed || 0) / (user?.storageLimit || 1)) * 100;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">个人中心</h1>
          <p className="text-gray-600">管理您的账户信息和设置</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 个人信息 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>个人信息</span>
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用户名
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="请输入用户名"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.username}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱地址
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="请输入邮箱地址"
                      />
                    ) : (
                      <p className="text-gray-900">{user?.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      个人简介
                    </label>
                    {isEditing ? (
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="介绍一下自己..."
                      />
                    ) : (
                      <p className="text-gray-900">
                        {user?.bio || '暂无个人简介'}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        注册时间
                      </label>
                      <p className="text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(user?.createdAt || new Date().toISOString())}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        用户角色
                      </label>
                      <p className="text-gray-900 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-gray-400" />
                        {user?.role === 'ADMIN' ? '管理员' : '普通用户'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 账户设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span>账户设置</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium text-gray-900">修改密码</h4>
                      <p className="text-sm text-gray-500">定期更新密码以保护账户安全</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      修改密码
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium text-gray-900">两步验证</h4>
                      <p className="text-sm text-gray-500">为账户添加额外的安全保护</p>
                    </div>
                    <Button variant="outline" size="sm">
                      启用
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium text-gray-900">导出数据</h4>
                      <p className="text-sm text-gray-500">下载您的所有图片和数据</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏统计 */}
          <div className="space-y-6">
            {/* 存储使用情况 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                  <span>存储使用</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatFileSize(user?.storageUsed || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      / {formatFileSize(user?.storageLimit || 0)}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(storageUsagePercent, 100)}%` }}
                    />
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    已使用 {storageUsagePercent.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 图片统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span>图片统计</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">总图片数</span>
                    <span className="font-semibold text-gray-900">{totalImages}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">总大小</span>
                    <span className="font-semibold text-gray-900">{formatFileSize(totalSize)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">本月上传</span>
                    <span className="font-semibold text-gray-900">
                      {images.filter(img => {
                        const imgDate = new Date(img.createdAt);
                        const now = new Date();
                        return imgDate.getMonth() === now.getMonth() && 
                               imgDate.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">总浏览量</span>
                    <span className="font-semibold text-gray-900">
                      {images.reduce((sum, img) => sum + (img.views || 0), 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    查看我的图片
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Share2 className="w-4 h-4 mr-2" />
                    分享管理
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    批量下载
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 修改密码模态框 */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-blue-600" />
                  修改密码
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordCancel}
                  disabled={passwordLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* 当前密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前密码
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="请输入当前密码"
                      className="pr-10"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 新密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新密码
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="请输入新密码（至少8个字符）"
                      className="pr-10"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 确认新密码 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    确认新密码
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="请再次输入新密码"
                      className="pr-10"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 密码强度提示 */}
                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-800 mb-1">密码要求：</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• 至少8个字符</li>
                    <li>• 建议包含大小写字母、数字和特殊字符</li>
                    <li>• 不要使用容易猜测的密码</li>
                  </ul>
                </div>
                
                {/* 按钮 */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handlePasswordCancel}
                    disabled={passwordLoading}
                  >
                    取消
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handlePasswordSubmit}
                    loading={passwordLoading}
                    disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {passwordLoading ? '修改中...' : '确认修改'}
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