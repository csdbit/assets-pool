import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Images, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符';
    }
    
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含字母和数字';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '请同意服务条款';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const success = await register({
      email: formData.email,
      username: formData.username,
      password: formData.password
    });
    
    if (success) {
      navigate('/gallery');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img src="/image-logo.png" alt="图床系统" className="mx-auto w-16 h-16 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">图床系统</h2>
          <p className="mt-2 text-gray-600">创建您的账户</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">用户注册</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  label="用户名"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="请输入用户名"
                  error={errors.username}
                  required
                  className="pl-10"
                />
                <User className="absolute left-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <Input
                  label="邮箱地址"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="请输入邮箱地址"
                  error={errors.email}
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
                  error={errors.password}
                  helperText="密码至少8位，包含字母和数字"
                  required
                  className="pl-10"
                />
                <Lock className="absolute left-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <Input
                  label="确认密码"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入密码"
                  error={errors.confirmPassword}
                  required
                  className="pl-10"
                />
                <Lock className="absolute left-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    我同意
                    <Link to="/terms" className="text-blue-600 hover:text-blue-500 mx-1">
                      服务条款
                    </Link>
                    和
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-500 mx-1">
                      隐私政策
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                )}
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                注册
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <span className="text-gray-600">已有账户？</span>
              <Link to="/login" className="ml-1 text-blue-600 hover:text-blue-500 font-medium">
                立即登录
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};