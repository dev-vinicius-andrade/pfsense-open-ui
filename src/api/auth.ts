import { post } from './client';
import type { AuthTokenResponse } from './types';

export async function login(username: string, password: string): Promise<AuthTokenResponse> {
  return post<AuthTokenResponse>('/auth/jwt', { username, password });
}

export async function logout(): Promise<void> {
  try {
    await post('/auth/logout');
  } catch {
    // Logout endpoint may not exist or may fail silently; client-side cleanup is authoritative.
  }
}