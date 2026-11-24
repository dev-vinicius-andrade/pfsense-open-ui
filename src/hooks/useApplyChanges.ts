import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/api/client';

interface UseApplyChangesOptions {
  endpoint: string;
  invalidateKeys?: string[][];
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useApplyChanges({
  endpoint,
  invalidateKeys = [],
  onSuccess,
  onError,
}: UseApplyChangesOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => post(endpoint),
    onSuccess: () => {
      for (const key of invalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      onSuccess?.();
    },
    onError,
  });
}