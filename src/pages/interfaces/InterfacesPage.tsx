import { Box } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import './panels';

export function InterfacesPage() {
  const applyMutation = useApplyChanges({
    endpoint: '/interface/apply',
    invalidateKeys: [['interfaces']],
  });

  return (
    <Box>
      <PageHeader title="Interfaces" />

      <PendingChangesBanner
        hasChanges={applyMutation.isPending}
        onApply={() => void applyMutation.mutateAsync()}
        isApplying={applyMutation.isPending}
        message="Interface changes have been made. Apply them to activate. This may cause brief connectivity loss."
      />

      <LayoutBuilder pageId="interfaces" />
    </Box>
  );
}