import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSystemStore } from '../store/systemStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Images, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const { login, isLoading } = useAuthStore();
  const { settings } = useSystemStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('请填写邮箱和密码');
      return;
    }
    
    const success = await login({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe
    });
    
    if (success) {
      // 如果有来源页面，返回到来源页面，否则跳转到图库
      const from = location.state?.from?.pathname || '/gallery';
      navigate(from, { replace: true });
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img src="/image-logo.png" alt="图床系统" className="mx-auto w-16 h-16 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">图床系统</h2>
          <p className="mt-2 text-gray-600">登录您的账户</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">用户登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  label="邮箱地址"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="请输入邮箱地址"
                  required
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <Input
                  label="密码"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入密码"
                  required
                  className="pl-10"
                />
                <Lock className="absolute left-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">记住我</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  忘记密码？
                </Link>
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                登录
              </Button>
            </form>
            
            {settings?.allowUserRegistration && (
              <div className="mt-6 text-center">
                <span className="text-gray-600">还没有账户？</span>
                <Link to="/register" className="ml-1 text-blue-600 hover:text-blue-500 font-medium">
                  立即注册
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};