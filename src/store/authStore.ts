import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  storageUsed: number;
  storageLimit: number;
  bio?: string;
  createdAt: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<boolean>;
  register: (data: { email: string; username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  verifyToken: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    rememberMe: false,
    
    login: async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
      try {
        set({ isLoading: true });
        const response = await apiClient.login(credentials.email, credentials.password);
        
        // 根据rememberMe选项设置token存储策略
        if (credentials.rememberMe) {
          // 记住我：将token存储到localStorage（持久化）
          localStorage.setItem('auth_token', response.token);
        } else {
          // 不记住：清除localStorage中的token，仅在内存中保存
          localStorage.removeItem('auth_token');
        }
        
        set({ 
          user: response.user, 
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
          rememberMe: credentials.rememberMe || false
        });
        
        toast.success('登录成功');
        return true;
      } catch (error) {
        console.error('Login error:', error);
        toast.error(error instanceof Error ? error.message : '登录失败');
        set({ isLoading: false });
        return false;
      }
    },
    
    register: async (data: { email: string; username: string; password: string }) => {
      try {
        set({ isLoading: true });
        const response = await apiClient.register(data.email, data.username, data.password);
        
        set({ 
          user: response.user, 
          token: response.token,
          isAuthenticated: true,
          isLoading: false 
        });
        
        toast.success('注册成功');
        return true;
      } catch (error) {
        console.error('Register error:', error);
        toast.error(error instanceof Error ? error.message : '注册失败');
        set({ isLoading: false });
        return false;
      }
    },
    
    logout: () => {
      apiClient.logout();
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isAuthenticated: false, rememberMe: false });
      toast.success('已退出登录');
    },
    
    updateUser: (userData) => {
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, ...userData } });
      }
    },
    
    verifyToken: async () => {
      const state = get();
      // 优先从localStorage获取token，然后从state获取
      const storedToken = localStorage.getItem('auth_token');
      const token = storedToken || state.token;
      
      console.log('verifyToken: 开始验证token', { storedToken: !!storedToken, stateToken: !!state.token });
      
      if (!token) {
        console.log('verifyToken: 没有找到token，设置为未认证状态');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        apiClient.setToken(null);
        return;
      }
      
      try {
        set({ isLoading: true });
        // 确保 API 客户端有正确的 token
        apiClient.setToken(token);
        console.log('verifyToken: 开始API验证');
        const response = await apiClient.verifyToken();
        console.log('verifyToken: API验证成功', response.user);
        
        // 如果从localStorage获取的token，需要同步到state
        if (storedToken && !state.token) {
          console.log('verifyToken: 同步localStorage的token到state');
        }
        
        set({ 
          user: response.user, 
          token,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Token verification failed:', error);
        // 只有在token确实无效时才清除，避免网络错误导致的误清除
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.log('verifyToken: token无效，清除认证状态');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth-storage');
          apiClient.setToken(null);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        } else {
          console.log('verifyToken: 网络错误，保持当前状态');
          // 网络错误时不清除token，只设置loading为false
          set({ isLoading: false });
        }
      }
    },
    
    refreshProfile: async () => {
      try {
        console.log('refreshProfile: 开始刷新用户信息');
        const response = await apiClient.getProfile();
        console.log('refreshProfile: API响应:', response);
        console.log('refreshProfile: 用户bio:', response.user?.bio);
        set({ user: response.user });
        console.log('refreshProfile: 状态已更新');
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    },
  }),
  {
    name: 'auth-storage',
    partialize: (state) => {
      // 检查localStorage中是否有token来决定是否持久化
      const hasStoredToken = localStorage.getItem('auth_token');
      
      if (hasStoredToken || state.rememberMe) {
        // 如果localStorage有token或用户选择记住我，则持久化完整状态
        return {
          token: state.token,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          rememberMe: state.rememberMe
        };
      }
      // 否则只持久化rememberMe状态
      return { rememberMe: state.rememberMe };
    },
    // 添加状态恢复逻辑
    onRehydrateStorage: () => (state) => {
      if (state) {
        console.log('zustand: 恢复认证状态', { 
          hasUser: !!state.user, 
          hasToken: !!state.token, 
          isAuthenticated: state.isAuthenticated 
        });
        
        // 如果有持久化的token，确保API客户端也设置了token
        if (state.token) {
          apiClient.setToken(state.token);
        }
      }
    },
  }
));