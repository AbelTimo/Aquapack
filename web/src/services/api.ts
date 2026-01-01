import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse } from '@/types';
import { isDemoMode, mockAuthApi, mockProjectsApi, mockSitesApi, mockBoreholesApi } from './mockApi';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<never>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const tokens = useAuthStore.getState().tokens;
      if (tokens?.refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data.data.tokens;
          useAuthStore.getState().updateTokens(newTokens);

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    // Check if using demo credentials
    if (email === 'demo@aquapack.io') {
      const result = await mockAuthApi.login(email, password);
      // Ensure demo mode is enabled before returning
      localStorage.setItem('aquapack-demo-mode', 'true');
      return result;
    }
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: { email: string; password: string; name: string; organizationName: string }) => {
    if (isDemoMode()) {
      return mockAuthApi.register();
    }
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    if (isDemoMode()) {
      return mockAuthApi.logout();
    }
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    if (isDemoMode()) {
      return mockAuthApi.getMe();
    }
    const response = await api.get('/auth/me');
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  getAll: async (params?: { search?: string; isActive?: boolean; page?: number; limit?: number }) => {
    if (isDemoMode()) {
      return mockProjectsApi.getAll(params);
    }
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getMyProjects: async () => {
    if (isDemoMode()) {
      return mockProjectsApi.getMyProjects();
    }
    const response = await api.get('/projects/my-projects');
    return response.data;
  },

  getById: async (id: string) => {
    if (isDemoMode()) {
      return mockProjectsApi.getById(id);
    }
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  getDashboard: async (id: string) => {
    if (isDemoMode()) {
      return mockProjectsApi.getDashboard(id);
    }
    const response = await api.get(`/projects/${id}/dashboard`);
    return response.data;
  },

  create: async (data: any) => {
    if (isDemoMode()) {
      return mockProjectsApi.create(data);
    }
    const response = await api.post('/projects', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    if (isDemoMode()) {
      return mockProjectsApi.update(id, data);
    }
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    if (isDemoMode()) {
      return mockProjectsApi.delete(id);
    }
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  assignUser: async (projectId: string, userId: string, role: string) => {
    const response = await api.post(`/projects/${projectId}/assign`, { userId, role });
    return response.data;
  },
};

// Sites API
export const sitesApi = {
  getAll: async (params?: { projectId?: string; qaStatus?: string; search?: string; page?: number; limit?: number }) => {
    if (isDemoMode()) {
      return mockSitesApi.getAll(params);
    }
    const response = await api.get('/sites', { params });
    return response.data;
  },

  getForMap: async (projectId: string) => {
    if (isDemoMode()) {
      return mockSitesApi.getForMap(projectId);
    }
    const response = await api.get(`/sites/map/${projectId}`);
    return response.data;
  },

  getById: async (id: string) => {
    if (isDemoMode()) {
      return mockSitesApi.getById(id);
    }
    const response = await api.get(`/sites/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    if (isDemoMode()) {
      return mockSitesApi.create(data);
    }
    const response = await api.post('/sites', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    if (isDemoMode()) {
      return mockSitesApi.update(id, data);
    }
    const response = await api.put(`/sites/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    if (isDemoMode()) {
      return mockSitesApi.delete(id);
    }
    const response = await api.delete(`/sites/${id}`);
    return response.data;
  },

  review: async (id: string, status: string, comment?: string) => {
    if (isDemoMode()) {
      return mockSitesApi.review(id, status, comment);
    }
    const response = await api.post(`/sites/${id}/review`, { status, comment });
    return response.data;
  },
};

// Boreholes API
export const boreholesApi = {
  getAll: async (params?: { siteId?: string; boreholeStatus?: string }) => {
    if (isDemoMode()) {
      return mockBoreholesApi.getAll(params);
    }
    const response = await api.get('/boreholes', { params });
    return response.data;
  },
};

export default api;
