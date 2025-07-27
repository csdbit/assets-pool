import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSystemStore } from '../../store/systemStore';
import { Button } from '../ui/Button';
import { 
  Upload, 
  Images, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { settings } = useSystemStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const navItems = [
    { to: '/upload', icon: Upload, label: '上传图片' },
    { to: '/gallery', icon: Images, label: '图片管理' },
    { to: '/profile', icon: User, label: '个人中心' },
  ];
  
  if (user?.role === 'ADMIN') {
    navItems.push({ to: '/admin', icon: Settings, label: '后台管理' });
  }
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/image-logo.png" alt="图床系统" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">图床系统</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-700">欢迎，{user?.username}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出</span>
                  </Button>
                </div>
                
                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">登录</Button>
                </Link>
                {settings?.allowUserRegistration && (
                  <Link to="/register">
                    <Button size="sm">注册</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <div className="px-3 py-2 text-sm text-gray-700">
                欢迎，{user?.username}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>退出</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};