import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useImageStore } from '../store/imageStore';
import { apiClient } from '../lib/api';
import {
  Users,
  Images,
  BarChart3,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Download,
  Calendar,
  HardDrive,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'overview' | 'users' | 'images' | 'settings';

export const Admin: React.FC = () => {
  const { user } = useAuthStore();
  const { images } = useImageStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [imageFilter, setImageFilter] = useState('all');
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 加载系统设置和数据
  useEffect(() => {
    loadSystemSettings();
    loadUsers();
    loadAdminStats();
  }, []);

  const loadSystemSettings = async () => {
    try {
      setSettingsLoading(true);
      const settings = await apiClient.getSystemSettings();
      setSystemSettings(settings);
    } catch (error) {
      console.error('Failed to load system settings:', error);
      // 如果获取失败，尝试初始化默认设置
      try {
        await apiClient.initSystemSettings();
        const settings = await apiClient.getSystemSettings();
        setSystemSettings(settings);
      } catch (initError) {
        console.error('Failed to initialize system settings:', initError);
        toast.error('加载系统设置失败');
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSystemSettings = async () => {
    try {
      setSettingsSaving(true);
      await apiClient.updateSystemSettings(systemSettings);
      toast.success('系统设置已保存');
    } catch (error) {
      console.error('Failed to save system settings:', error);
      toast.error('保存系统设置失败');
    } finally {
      setSettingsSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await apiClient.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('加载用户数据失败');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await apiClient.getAdminStats();
      setAdminStats(stats);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      toast.error('加载统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  };

  // 检查管理员权限
  if (user?.role !== 'ADMIN') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">访问被拒绝</h1>
            <p className="text-gray-600 mb-8">您没有权限访问管理后台。</p>
            <Button onClick={() => window.history.back()}>返回</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('zh-CN');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case 'activate':
          await apiClient.updateUserStatus(userId, 'ACTIVE');
          toast.success('用户已激活');
          loadUsers();
          break;
        case 'suspend':
          await apiClient.updateUserStatus(userId, 'SUSPENDED');
          toast.success('用户已暂停');
          loadUsers();
          break;
        case 'delete':
          if (window.confirm('确定要删除此用户吗？此操作不可撤销。')) {
            await apiClient.deleteUser(userId);
            toast.success('用户已删除');
            loadUsers();
          }
          break;
      }
    } catch (error) {
      console.error('User action failed:', error);
      toast.error('操作失败');
    }
  };

  const handleImageAction = async (imageId: string, action: string) => {
    try {
      switch (action) {
        case 'delete':
          if (window.confirm('确定要删除此图片吗？此操作不可撤销。')) {
            await apiClient.deleteImage(imageId);
            toast.success('图片已删除');
            // 重新加载图片数据
            window.location.reload();
          }
          break;
        case 'hide':
           await apiClient.hideImage(imageId);
           toast.success('图片已隐藏');
           window.location.reload();
           break;
      }
    } catch (error) {
      console.error('Image action failed:', error);
      toast.error('操作失败');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === 'all' || 
                         (userFilter === 'active' && user.status === 'ACTIVE') ||
                         (userFilter === 'suspended' && user.status === 'SUSPENDED');
    return matchesSearch && matchesFilter;
  });

  const filteredImages = images.filter(image => {
    const matchesSearch = image.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = imageFilter === 'all' || 
                         (imageFilter === 'recent' && new Date(image.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return matchesSearch && matchesFilter;
  });

  const totalUsers = adminStats?.totalUsers || 0;
  const activeUsers = adminStats?.activeUsers || 0;
  const totalImages = adminStats?.totalImages || 0;
  const totalStorage = parseInt(adminStats?.totalStorage || '0');
  const maxSystemStorage = parseInt(adminStats?.maxSystemStorage || '10737418240'); // 默认10GB
  const storagePercentage = maxSystemStorage > 0 ? Math.round((totalStorage / maxSystemStorage) * 100) : 0;
  const todayUploads = adminStats?.recentImages?.filter((img: any) => {
    const today = new Date();
    const imgDate = new Date(img.createdAt);
    return imgDate.toDateString() === today.toDateString();
  }).length || 0;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% 本月
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃用户</p>
                <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% 本月
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总图片数</p>
                <p className="text-2xl font-bold text-gray-900">{totalImages}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  今日 +{todayUploads}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Images className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">存储使用</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(totalStorage)}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        storagePercentage > 90 ? 'bg-red-600' : 
                        storagePercentage > 70 ? 'bg-orange-600' : 
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {storagePercentage}% 已使用 / {formatFileSize(maxSystemStorage)}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近注册用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(adminStats?.recentUsers || []).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(user.createdAt)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      user.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'ACTIVE' ? '活跃' : '暂停'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近上传图片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(adminStats?.recentImages || []).map((image: any) => (
                <div key={image.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{image.title}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(image.size)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(image.createdAt)}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <Eye className="w-3 h-3 mr-1" />
                      {image.views || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="active">活跃</option>
          <option value="suspended">暂停</option>
        </select>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">用户</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">角色</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">存储使用</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">图片数</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">最后登录</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        user.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'ACTIVE' ? '活跃' : '暂停'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{formatFileSize(user.storageUsed || 0)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{user._count?.images || 0}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-500">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {user.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'suspend')}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'activate')}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderImages = () => (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索图片标题..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={imageFilter}
          onChange={(e) => setImageFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部图片</option>
          <option value="recent">最近一周</option>
        </select>
      </div>

      {/* 图片列表 */}
      <Card>
        <CardHeader>
          <CardTitle>图片管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredImages.map(image => (
              <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-1">{image.title}</h4>
                  <p className="text-sm text-gray-500 mb-2">{formatFileSize(image.size)}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{formatDate(image.createdAt)}</span>
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {image.views || 0}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`/image/${image.id}`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageAction(image.id, 'delete')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            系统设置
            {settingsLoading && (
              <div className="text-sm text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                加载中...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">用户管理设置</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowUserRegistration"
                    checked={systemSettings.allowUserRegistration ?? true}
                    onChange={(e) => updateSetting('allowUserRegistration', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={settingsLoading}
                  />
                  <label htmlFor="allowUserRegistration" className="text-sm text-gray-700">
                    允许前端用户注册
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  关闭后，新用户将无法通过注册页面创建账户
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">存储设置</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    默认存储限制 (GB)
                  </label>
                  <Input 
                    type="number" 
                    value={systemSettings.defaultStorageLimit ? (systemSettings.defaultStorageLimit / (1024 * 1024 * 1024)).toString() : '1'}
                    onChange={(e) => updateSetting('defaultStorageLimit', parseFloat(e.target.value) * 1024 * 1024 * 1024)}
                    disabled={settingsLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大文件大小 (MB)
                  </label>
                  <Input 
                    type="number" 
                    value={systemSettings.maxFileSize ? (systemSettings.maxFileSize / (1024 * 1024)).toString() : '10'}
                    onChange={(e) => updateSetting('maxFileSize', parseFloat(e.target.value) * 1024 * 1024)}
                    disabled={settingsLoading}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">图片处理设置</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoGenerateThumbnails"
                    checked={systemSettings.autoGenerateThumbnails ?? true}
                    onChange={(e) => updateSetting('autoGenerateThumbnails', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={settingsLoading}
                  />
                  <label htmlFor="autoGenerateThumbnails" className="text-sm text-gray-700">
                    自动生成缩略图
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableWatermark"
                    checked={systemSettings.enableWatermark ?? false}
                    onChange={(e) => updateSetting('enableWatermark', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={settingsLoading}
                  />
                  <label htmlFor="enableWatermark" className="text-sm text-gray-700">
                    添加水印
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoCompress"
                    checked={systemSettings.autoCompress ?? true}
                    onChange={(e) => updateSetting('autoCompress', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={settingsLoading}
                  />
                  <label htmlFor="autoCompress" className="text-sm text-gray-700">
                    自动压缩
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">安全设置</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requireLoginToUpload"
                    checked={systemSettings.requireLoginToUpload ?? true}
                    onChange={(e) => updateSetting('requireLoginToUpload', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={settingsLoading}
                  />
                  <label htmlFor="requireLoginToUpload" className="text-sm text-gray-700">
                    需要登录才能上传
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableHotlinkProtection"
                    checked={systemSettings.enableHotlinkProtection ?? false}
                    onChange={(e) => updateSetting('enableHotlinkProtection', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={settingsLoading}
                  />
                  <label htmlFor="enableHotlinkProtection" className="text-sm text-gray-700">
                    启用防盗链保护
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableContentFilter"
                    checked={systemSettings.enableContentFilter ?? true}
                    onChange={(e) => updateSetting('enableContentFilter', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={settingsLoading}
                  />
                  <label htmlFor="enableContentFilter" className="text-sm text-gray-700">
                    启用内容过滤
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex space-x-3">
              <Button 
                onClick={saveSystemSettings}
                disabled={settingsLoading || settingsSaving}
                className="flex items-center"
              >
                {settingsSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {settingsSaving ? '保存中...' : '保存设置'}
              </Button>
              <Button 
                variant="outline"
                onClick={loadSystemSettings}
                disabled={settingsLoading || settingsSaving}
              >
                重新加载
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
          <p className="text-gray-600">系统管理和监控面板</p>
        </div>

        {/* 标签导航 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '概览', icon: BarChart3 },
              { id: 'users', label: '用户管理', icon: Users },
              { id: 'images', label: '图片管理', icon: Images },
              { id: 'settings', label: '系统设置', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 内容区域 */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'images' && renderImages()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </Layout>
  );
};