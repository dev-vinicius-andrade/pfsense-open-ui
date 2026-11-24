import { useCallback } from 'react';
import { useAuthStore } from './authStore';
import { login as apiLogin, logout as apiLogout } from '@/api/auth';
import type { UserInfo } from '@/api/types';

export function useAuth() {
  const { token, user, isAuthenticated, setToken, logout: clearAuth } = useAuthStore();

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await apiLogin(username, password);
      const userInfo: UserInfo = { username, privileges: [] };
      setToken(response.token, userInfo);
    },
    [setToken],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    clearAuth();
  }, [clearAuth]);

  return { token, user, isAuthenticated, login, logout };
}