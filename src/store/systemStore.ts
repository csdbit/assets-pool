import { create } from 'zustand';
import { apiClient } from '../lib/api';

interface SystemSettings {
  allowUserRegistration: boolean;
  siteName: string;
  siteDescription: string;
}

interface SystemState {
  settings: SystemSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchPublicSettings: () => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,
  
  fetchPublicSettings: async () => {
    set({ isLoading: true, error: null });
    console.log('开始获取系统设置...');
    
    try {
      const settings = await apiClient.getPublicSettings();
      console.log('获取到的系统设置:', settings);
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch public settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
        isLoading: false,
        // 设置默认值
        settings: {
          allowUserRegistration: true,
          siteName: '图床系统',
          siteDescription: '专业的图片托管服务'
        }
      });
    }
  }
}));