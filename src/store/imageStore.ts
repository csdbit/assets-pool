import { create } from 'zustand';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';

export interface Image {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  url: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  versions?: ImageVersion[];
  shares?: Share[];
  views?: number;
  format?: string;
  thumbnails?: Record<string, string>;
  user?: {
    id: string;
    username: string;
  };
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface ImageVersion {
  id: string;
  imageId: string;
  filename: string;
  size: string;
  width: number;
  height: number;
  url: string;
  type: 'ORIGINAL' | 'LARGE' | 'MEDIUM' | 'SMALL';
  createdAt: string;
}

export interface Share {
  id: string;
  imageId: string;
  shareId: string;
  expiresAt: string;
  createdAt: string;
}

export interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface ImageState {
  images: Image[];
  currentImage: Image | null;
  tags: Tag[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    search: string;
    tag: string;
  };
  uploadProgress: UploadProgress[];
  
  // Actions
  fetchImages: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
  }) => Promise<void>;
  fetchImage: (id: string) => Promise<void>;
  uploadImage: (file: File, data: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => Promise<boolean>;
  updateImage: (id: string, data: {
    title?: string;
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => Promise<boolean>;
  deleteImage: (id: string) => Promise<boolean>;
  fetchTags: () => Promise<void>;
  setFilters: (filters: Partial<{ search: string; tag: string }>) => void;
  clearCurrentImage: () => void;
  addImage: (image: Image) => void;
  addUploadProgress: (progress: UploadProgress) => void;
  updateUploadProgress: (id: string, updates: Partial<UploadProgress>) => void;
  removeUploadProgress: (id: string) => void;
  clearUploadProgress: () => void;
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  currentImage: null,
  tags: [],
  isLoading: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    search: '',
    tag: '',
  },
  uploadProgress: [],

  fetchImages: async (params = {}) => {
    try {
      set({ isLoading: true });
      const { filters, pagination } = get();
      
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      
      // 过滤掉空值
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key as keyof typeof queryParams]) {
          delete queryParams[key as keyof typeof queryParams];
        }
      });
      
      const response = await apiClient.getImages(queryParams);
      
      set({
        images: response.images,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch images:', error);
      
      // 检查是否是认证错误
      if (error instanceof Error && error.message.includes('Invalid or expired token')) {
        // 不显示错误提示，让认证系统处理
        console.log('Token expired, authentication system will handle this');
      } else {
        toast.error('获取图片列表失败');
      }
      
      set({ isLoading: false });
    }
  },

  fetchImage: async (id: string) => {
    try {
      set({ isLoading: true });
      const image = await apiClient.getImage(id);
      set({ currentImage: image, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch image:', error);
      toast.error('获取图片详情失败');
      set({ isLoading: false });
    }
  },

  uploadImage: async (file: File, data) => {
    try {
      set({ isLoading: true });
      
      const formData = new FormData();
      formData.append('image', file);
      
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
      
      const response = await apiClient.uploadImage(formData);
      
      // 重新获取图片列表
      await get().fetchImages();
      
      set({ isLoading: false });
      toast.success('图片上传成功');
      return true;
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error(error instanceof Error ? error.message : '图片上传失败');
      set({ isLoading: false });
      return false;
    }
  },

  updateImage: async (id: string, data) => {
    try {
      set({ isLoading: true });
      
      const response = await apiClient.updateImage(id, data);
      
      // 更新本地状态
      const { images, currentImage } = get();
      const updatedImages = images.map(img => 
        img.id === id ? response.image : img
      );
      
      set({
        images: updatedImages,
        currentImage: currentImage?.id === id ? response.image : currentImage,
        isLoading: false,
      });
      
      toast.success('图片信息更新成功');
      return true;
    } catch (error) {
      console.error('Failed to update image:', error);
      toast.error('更新图片信息失败');
      set({ isLoading: false });
      return false;
    }
  },

  deleteImage: async (id: string) => {
    try {
      set({ isLoading: true });
      
      await apiClient.deleteImage(id);
      
      // 从本地状态中移除
      const { images, currentImage } = get();
      const filteredImages = images.filter(img => img.id !== id);
      
      set({
        images: filteredImages,
        currentImage: currentImage?.id === id ? null : currentImage,
        isLoading: false,
      });
      
      toast.success('图片删除成功');
      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('删除图片失败');
      set({ isLoading: false });
      return false;
    }
  },

  fetchTags: async () => {
    try {
      const response = await apiClient.getTags();
      set({ tags: response.tags });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      toast.error('获取标签列表失败');
    }
  },

  setFilters: (newFilters) => {
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    set({ filters: updatedFilters });
    
    // 重新获取图片列表
    get().fetchImages({ page: 1, ...updatedFilters });
  },

  clearCurrentImage: () => {
    set({ currentImage: null });
  },

  addImage: (image) => {
    const { images } = get();
    set({ images: [image, ...images] });
  },

  addUploadProgress: (progress) => {
    const { uploadProgress } = get();
    set({ uploadProgress: [...uploadProgress, progress] });
  },

  updateUploadProgress: (id, updates) => {
    const { uploadProgress } = get();
    const updatedProgress = uploadProgress.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    set({ uploadProgress: updatedProgress });
  },

  removeUploadProgress: (id) => {
    const { uploadProgress } = get();
    const filteredProgress = uploadProgress.filter(p => p.id !== id);
    set({ uploadProgress: filteredProgress });
  },

  clearUploadProgress: () => {
    set({ uploadProgress: [] });
  },
}));