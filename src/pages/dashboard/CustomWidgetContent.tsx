import { Typography } from '@mui/material';
import type { CustomWidget } from '@/config/schema';
import { ConfigWidgetRenderer } from './ConfigWidgetRenderer';
import { TemplateWidgetRenderer } from './TemplateWidgetRenderer';

interface CustomWidgetContentProps {
  widget: CustomWidget;
}

export function CustomWidgetContent({ widget }: CustomWidgetContentProps) {
  if (widget.type === 'config') {
    return <ConfigWidgetRenderer widget={widget} />;
  }
  if (widget.type === 'template') {
    return <TemplateWidgetRenderer widget={widget} />;
  }
  return <Typography color="error">Unknown widget type</Typography>;
}