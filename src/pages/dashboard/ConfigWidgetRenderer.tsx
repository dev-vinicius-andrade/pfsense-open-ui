import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Skeleton, Typography } from '@mui/material';
import type { ConfigWidget } from '@/config/schema';
import { getDataSourceById } from './dataSourceRegistry';
import { getDisplayComponent } from './displayTypes';
import { get } from '@/api/client';

interface ConfigWidgetRendererProps {
  widget: ConfigWidget;
}

interface ApiResponse<T = unknown> {
  data: T;
}

function applyFieldMapping(
  rawData: Record<string, unknown>,
  fieldMapping: Record<string, string> | undefined,
  defaultMapping: Record<string, string> | undefined,
): Record<string, unknown> {
  const mapping = fieldMapping ?? defaultMapping;
  if (!mapping) return rawData;

  const result: Record<string, unknown> = {};
  for (const [targetKey, sourceKey] of Object.entries(mapping)) {
    const value = resolveNestedValue(rawData, sourceKey);
    if (value !== undefined) {
      result[targetKey] = value;
    }
  }
  return result;
}

function resolveNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function ConfigWidgetRenderer({ widget }: ConfigWidgetRendererProps) {
  const dataSource = useMemo(() => getDataSourceById(widget.dataSource), [widget.dataSource]);

  const { data, isLoading, isError, error, refetch } = useQuery<ApiResponse>({
    queryKey: ['custom-widget', widget.id, dataSource?.endpoint],
    queryFn: () => get<ApiResponse>(dataSource?.endpoint ?? ''),
    enabled: !!dataSource,
    refetchInterval: widget.refreshInterval * 1000,
    staleTime: (widget.refreshInterval / 2) * 1000,
  });

  if (!dataSource) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Unknown data source: {widget.dataSource}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={120} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        {error instanceof Error ? error.message : 'Failed to load data'}
      </Alert>
    );
  }

  const rawResponse = data?.data;
  if (rawResponse == null) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  const responseObj = typeof rawResponse === 'object' && !Array.isArray(rawResponse)
    ? rawResponse as Record<string, unknown>
    : { value: rawResponse };

  const mappedData = applyFieldMapping(responseObj, widget.fieldMapping, dataSource.defaultFieldMapping);
  const DisplayComponent = getDisplayComponent(widget.displayType);

  return (
    <Box sx={{ p: 2 }}>
      <DisplayComponent
        {...mappedData}
        label={widget.title}
        thresholds={widget.thresholds}
        accentColor={widget.accentColor}
      />
    </Box>
  );
}