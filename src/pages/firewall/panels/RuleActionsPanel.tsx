import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PendingChangesBanner } from '@/components/shared/PendingChangesBanner';
import { useApplyChanges } from '@/hooks/useApplyChanges';
import { firewallQueryKeys, fetchFirewallRules } from '@/api/modules/firewall';
import { useFirewallRuleContext } from '../FirewallRuleContext';

interface RuleActionsPanelProps {
 panelId: string;
}

export function RuleActionsPanel({ panelId }: RuleActionsPanelProps) {
 const queryClient = useQueryClient();
 const { hasPendingChanges, setHasPendingChanges, handleCreate } = useFirewallRuleContext();

 const { isLoading } = useQuery({
 queryKey: firewallQueryKeys.rules,
 queryFn: fetchFirewallRules,
 });

 const applyChanges = useApplyChanges({
 endpoint: '/firewall/apply',
 invalidateKeys: [[...firewallQueryKeys.rules]],
 onSuccess: () => setHasPendingChanges(false),
 });

 const handleRefresh = () => {
 void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
 };

 return (
 <Box data-panel-id={panelId} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
 <PendingChangesBanner
 hasChanges={hasPendingChanges}
 onApply={() => applyChanges.mutate()}
 isApplying={applyChanges.isPending}
 />

 <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
 <Button startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={isLoading}>
 Refresh
 </Button>
 <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate} color="primary">
 Add Rule
 </Button>
 </Box>
 </Box>
 );
}