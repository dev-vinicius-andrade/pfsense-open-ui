import type { ComponentType } from 'react';
import type { ConfigWidget } from '../../../config/schema';
import { StatCard } from './StatCard';
import { GaugeDisplay } from './GaugeDisplay';
import { LineChartDisplay } from './LineChartDisplay';
import { BarChartDisplay } from './BarChartDisplay';
import { TableDisplay } from './TableDisplay';
import { ListDisplay } from './ListDisplay';
import { StatusIndicator } from './StatusIndicator';

export { StatCard } from './StatCard';
export { GaugeDisplay } from './GaugeDisplay';
export { LineChartDisplay } from './LineChartDisplay';
export { BarChartDisplay } from './BarChartDisplay';
export { TableDisplay } from './TableDisplay';
export { ListDisplay } from './ListDisplay';
export { StatusIndicator } from './StatusIndicator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDisplayComponent(type: ConfigWidget['displayType']): ComponentType<any> {
  switch (type) {
    case 'gauge':
      return GaugeDisplay;
    case 'stat-card':
      return StatCard;
    case 'line-chart':
      return LineChartDisplay;
    case 'bar-chart':
      return BarChartDisplay;
    case 'table':
      return TableDisplay;
    case 'list':
      return ListDisplay;
    case 'status-indicator':
      return StatusIndicator;
    default:
      return StatCard;
  }
}