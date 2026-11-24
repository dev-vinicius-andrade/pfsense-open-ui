export interface ApiResponse<T> {
  status: 'ok' | 'error';
  code?: number;
  message?: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
}

export interface BaseEntity {
  id?: string | number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  perPage: number;
}

export interface SystemVersion {
  version: string;
  build_date: string;
  platform: string;
  branch: string;
}

export interface AuthTokenResponse {
  token: string;
  expires_in: number;
}

export interface UserInfo {
  username: string;
  privileges: string[];
}