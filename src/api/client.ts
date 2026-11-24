import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/auth/authStore';
import type { ApiError } from './types';
import { IS_DEMO, mockFetch } from '@/mocks/mockClient';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_PFSENSE_API_URL || '/api/v2',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data as ApiError | undefined;

    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (status === 403) {
      console.error('Permission denied:', data?.message);
    } else if (!error.response) {
      console.error('Network error: unable to reach pfSense appliance');
    }

    return Promise.reject(error);
  },
);

/**
 * In demo mode, all API helpers bypass Axios entirely and return mock data.
 * This allows the app to render on GitHub Pages without a live pfSense backend.
 */

export async function get<T>(url: string, _config?: AxiosRequestConfig): Promise<T> {
  if (IS_DEMO) return mockFetch('GET', url) as T;
  const response = await apiClient.get<T>(url, _config);
  return response.data;
}

export async function post<T>(url: string, data?: unknown, _config?: AxiosRequestConfig): Promise<T> {
  if (IS_DEMO) return mockFetch('POST', url) as T;
  const response = await apiClient.post<T>(url, data, _config);
  return response.data;
}

export async function put<T>(url: string, data?: unknown, _config?: AxiosRequestConfig): Promise<T> {
  if (IS_DEMO) return mockFetch('PUT', url) as T;
  const response = await apiClient.put<T>(url, data, _config);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown, _config?: AxiosRequestConfig): Promise<T> {
  if (IS_DEMO) return mockFetch('PATCH', url) as T;
  const response = await apiClient.patch<T>(url, data, _config);
  return response.data;
}

export async function del<T>(url: string, _config?: AxiosRequestConfig): Promise<T> {
  if (IS_DEMO) return mockFetch('DELETE', url) as T;
  const response = await apiClient.delete<T>(url, _config);
  return response.data;
}

export default apiClient;