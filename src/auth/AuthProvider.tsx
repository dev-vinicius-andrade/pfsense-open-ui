import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuthStore } from './authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      document.documentElement.setAttribute('data-authenticated', 'true');
    } else {
      document.documentElement.removeAttribute('data-authenticated');
    }
  }, [token]);

  return <>{children}</>;
}