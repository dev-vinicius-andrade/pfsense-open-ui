import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Box, Dialog, DialogTitle } from '@mui/material';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LayoutBuilder } from '@/layout/LayoutBuilder';
import { getErrorMessage } from '@/utils/errorMessage';
import {
 createFirewallRule,
 updateFirewallRule,
 deleteFirewallRule,
 firewallQueryKeys,
 type FirewallRule,
} from '@/api/modules/firewall';
import { FirewallRuleForm, type FirewallRuleFormData } from './FirewallRuleForm';
import {
 FirewallRuleContextProvider,
 useFirewallRuleContext,
} from './FirewallRuleContext';

// Side-effect import: registers firewall panels on module load
import './panels';

const FLOATING_TAB_KEY = '__floating__';
const IFACE_PARAM = 'iface';

// --- Inner component that has access to context ---

function FirewallRulesPageInner() {
 const queryClient = useQueryClient();
 const { enqueueSnackbar } = useSnackbar();
 const [searchParams] = useSearchParams();

 const {
 editingRule,
 setEditingRule,
 dialogOpen,
 setDialogOpen,
 setHasPendingChanges,
 deleteTarget,
 setDeleteTarget,
 } = useFirewallRuleContext();

 // Determine active tab from URL for form pre-fill
 const activeTabKey = useMemo(() => {
 return searchParams.get(IFACE_PARAM) ?? '';
 }, [searchParams]);

 // --- Mutations ---

 const createMutation = useMutation({
 mutationFn: createFirewallRule,
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
 setHasPendingChanges(true);
 setDialogOpen(false);
 setEditingRule(null);
 },
 });

 const updateMutation = useMutation({
 mutationFn: ({ id, input }: { id: number; input: Partial<FirewallRuleFormData> }) =>
 updateFirewallRule(id, input),
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
 setHasPendingChanges(true);
 setDialogOpen(false);
 setEditingRule(null);
 },
 });

 const deleteMutation = useMutation({
 mutationFn: deleteFirewallRule,
 onSuccess: () => {
 void queryClient.invalidateQueries({ queryKey: firewallQueryKeys.rules });
 setHasPendingChanges(true);
 setDeleteTarget(null);
 },
 onError: (err: unknown) => {
 enqueueSnackbar(getErrorMessage(err, 'Failed to delete firewall rule'), { variant: 'error' });
 },
 });

 // --- Handlers ---

 const handleFormSubmit = (formData: FirewallRuleFormData) => {
 if (editingRule) {
 updateMutation.mutate({ id: editingRule.id, input: formData });
 } else {
 const formWithInterface = {
 ...formData,
 interface: activeTabKey === FLOATING_TAB_KEY ? '' : activeTabKey,
 };
 createMutation.mutate(formWithInterface);
 }
 };

 const isSubmitting = createMutation.isPending || updateMutation.isPending;
 const defaultInterfaceForForm = activeTabKey === FLOATING_TAB_KEY ? '' : activeTabKey;

 return (
 <Box>
 <PageHeader title="Firewall Rules" />

 <LayoutBuilder pageId="firewall" />

 {/* Create / Edit Dialog */}
 <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
 <DialogTitle>{editingRule ? 'Edit Firewall Rule' : 'Create Firewall Rule'}</DialogTitle>
 <Box sx={{ px: 3, pb: 3 }}>
 <FirewallRuleForm
 initialData={
 editingRule ??
 (!editingRule
 ? ({ interface: defaultInterfaceForForm } as FirewallRule)
 : null)
 }
 onSubmit={handleFormSubmit}
 onCancel={() => setDialogOpen(false)}
 isSubmitting={isSubmitting}
 />
 </Box>
 </Dialog>

 {/* Delete Confirmation */}
 <ConfirmDialog
 open={deleteTarget !== null}
 title="Delete Firewall Rule"
 message={`Are you sure you want to delete rule "${deleteTarget?.description || deleteTarget?.id}"? This change will be pending until applied.`}
 confirmLabel="Delete"
 destructive
 onConfirm={() => {
 if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
 }}
 onCancel={() => setDeleteTarget(null)}
 />
 </Box>
 );
}

// --- Main Page Component ---

export function FirewallRulesPage() {
 const [searchParams] = useSearchParams();

 const initialActiveTab = useMemo(() => {
 return searchParams.get(IFACE_PARAM) ?? '';
 }, [searchParams]);

 return (
 <FirewallRuleContextProvider initialActiveTab={initialActiveTab}>
 <FirewallRulesPageInner />
 </FirewallRuleContextProvider>
 );
}