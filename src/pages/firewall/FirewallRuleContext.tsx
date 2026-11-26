import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FirewallRule } from '@/api/modules/firewall';

interface FirewallRuleContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  editingRule: FirewallRule | null;
  setEditingRule: (rule: FirewallRule | null) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  hasPendingChanges: boolean;
  setHasPendingChanges: (pending: boolean) => void;
  deleteTarget: FirewallRule | null;
  setDeleteTarget: (rule: FirewallRule | null) => void;
  handleCreate: () => void;
  handleEdit: (rule: FirewallRule) => void;
}

const FirewallRuleContext = createContext<FirewallRuleContextValue | null>(null);

interface FirewallRuleContextProviderProps {
  children: ReactNode;
  initialActiveTab: string;
}

export function FirewallRuleContextProvider({
  children,
  initialActiveTab,
}: FirewallRuleContextProviderProps) {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FirewallRule | null>(null);

  const handleCreate = useCallback(() => {
    setEditingRule(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((rule: FirewallRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  }, []);

  return (
    <FirewallRuleContext.Provider
      value={{
        activeTab,
        setActiveTab,
        editingRule,
        setEditingRule,
        dialogOpen,
        setDialogOpen,
        hasPendingChanges,
        setHasPendingChanges,
        deleteTarget,
        setDeleteTarget,
        handleCreate,
        handleEdit,
      }}
    >
      {children}
    </FirewallRuleContext.Provider>
  );
}

export function useFirewallRuleContext(): FirewallRuleContextValue {
  const context = useContext(FirewallRuleContext);
  if (!context) {
    throw new Error('useFirewallRuleContext must be used within a FirewallRuleContextProvider');
  }
  return context;
}