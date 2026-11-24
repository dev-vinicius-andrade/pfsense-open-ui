import type { AxiosError } from 'axios';
import type { ApiError } from '@/api/types';

export function getErrorMessage(error: unknown, fallback = 'Operation failed'): string {
  const axiosError = error as AxiosError<ApiError> | undefined;
  return axiosError?.response?.data?.message || fallback;
}