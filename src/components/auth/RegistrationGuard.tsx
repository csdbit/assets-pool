import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSystemStore } from '../../store/systemStore';

interface RegistrationGuardProps {
  children: React.ReactNode;
}

export const RegistrationGuard: React.FC<RegistrationGuardProps> = ({ children }) => {
  const { settings, isLoading } = useSystemStore();

  // 如果还在加载设置，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果不允许注册，重定向到登录页
  if (settings && !settings.allowUserRegistration) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};