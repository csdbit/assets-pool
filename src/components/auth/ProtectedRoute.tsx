import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, user, isLoading, token } = useAuthStore();
  const location = useLocation();

  console.log('ProtectedRoute: 路由保护检查', {
    path: location.pathname,
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    hasToken: !!token,
    requireAdmin,
    userRole: user?.role
  });

  // 如果正在加载认证状态，显示加载界面
  if (isLoading) {
    console.log('ProtectedRoute: 显示加载状态');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证登录状态中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: 用户未认证，重定向到登录页');
    // 保存用户想要访问的路径，登录后可以重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    console.log('ProtectedRoute: 用户无管理员权限，重定向到首页');
    // 如果需要管理员权限但用户不是管理员，重定向到首页
    return <Navigate to="/" replace />;
  }

  console.log('ProtectedRoute: 认证通过，渲染受保护内容');
  return <>{children}</>;
};