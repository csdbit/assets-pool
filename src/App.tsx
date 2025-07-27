import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import { useSystemStore } from './store/systemStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RegistrationGuard } from './components/auth/RegistrationGuard';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Upload } from './pages/Upload';
import { Gallery } from './pages/Gallery';
import { Profile } from './pages/Profile';
import { ImageDetail } from './pages/ImageDetail';
import { Admin } from './pages/Admin';

function App() {
  const { verifyToken, isAuthenticated, token } = useAuthStore();
  const { fetchPublicSettings } = useSystemStore();
  
  // 应用启动时获取系统设置
  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);
  
  // 应用启动时验证 token
  useEffect(() => {
    console.log('App: 应用启动，当前认证状态', { isAuthenticated, hasToken: !!token });
    
    // 检查是否有存储的token
    const storedToken = localStorage.getItem('auth_token');
    console.log('App: localStorage中的token', { hasStoredToken: !!storedToken });
    
    // 如果有token（无论是state中的还是localStorage中的），都需要验证
    if (storedToken || token) {
      console.log('App: 发现token，开始验证');
      // 稍微延迟验证，确保zustand状态已经恢复
      const timer = setTimeout(() => {
        verifyToken();
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
      console.log('App: 没有找到token，跳过验证');
    }
  }, [verifyToken, token, isAuthenticated]);
  
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={
            <RegistrationGuard>
              <Register />
            </RegistrationGuard>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<ImageDetail />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/image/:id" element={<ImageDetail />} />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
