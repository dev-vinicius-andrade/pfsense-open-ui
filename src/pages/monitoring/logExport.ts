import type { LogEntry } from '@/api/modules/monitoring';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsvContent(logs: LogEntry[]): string {
  const headers = ['Timestamp', 'Severity', 'Source', 'Message'];
  const rows = logs.map((log) => [
    escapeCsvField(log.timestamp),
    escapeCsvField(log.severity),
    escapeCsvField(log.source),
    escapeCsvField(log.message),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportLogsAsCsv(logs: LogEntry[], filename: string): void {
  const csv = buildCsvContent(logs);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function exportLogsAsJson(logs: LogEntry[], filename: string): void {
  const json = JSON.stringify(logs, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}