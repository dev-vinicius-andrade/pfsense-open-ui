import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { useGroupedWidgets } from './dashboard/useDashboardLayout';
import type { ResolvedWidget } from './dashboard/useDashboardLayout';

function WidgetRenderer({ widget }: { widget: ResolvedWidget }) {
  const Component = widget.component;
  return (
    <Box sx={{ mb: 3 }}>
      <Component />
    </Box>
  );
}

export function DashboardPage() {
  const groups = useGroupedWidgets();

  return (
    <Box>
      <PageHeader title="Dashboard" />
      {groups.map((group) => (
        <Box key={group.category} sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ mt: group.category === 'system' ? 0 : 2 }}>
            {group.label}
          </Typography>
          {group.widgets.map((widget) => (
            <WidgetRenderer key={widget.id} widget={widget} />
          ))}
        </Box>
      ))}
      {groups.length === 0 && (
        <Typography color="text.secondary">No widgets configured.</Typography>
      )}
    </Box>
  );
}