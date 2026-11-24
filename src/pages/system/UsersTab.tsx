import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchUsers,
  fetchUserGroups,
  createUser,
  updateUser,
  deleteUser,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  systemQueryKeys,
  type User,
  type UserGroup,
} from '@/api/modules/system';

// --- Privilege Tree Data (simplified representation) ---

const PRIVILEGE_TREE = [
  {
    id: 'page-all',
    label: 'All Pages',
    children: [
      { id: 'page-dashboard', label: 'Dashboard' },
      { id: 'page-firewall', label: 'Firewall', children: [
        { id: 'page-firewall-rules', label: 'Rules' },
        { id: 'page-firewall-nat', label: 'NAT' },
        { id: 'page-firewall-aliases', label: 'Aliases' },
      ]},
      { id: 'page-interfaces', label: 'Interfaces' },
      { id: 'page-services', label: 'Services' },
      { id: 'page-vpn', label: 'VPN' },
      { id: 'page-system', label: 'System', children: [
        { id: 'page-system-general', label: 'General Setup' },
        { id: 'page-system-usermanager', label: 'User Manager' },
        { id: 'page-system-certmanager', label: 'Certificate Manager' },
        { id: 'page-system-firmware', label: 'Firmware Update' },
      ]},
      { id: 'page-diagnostics', label: 'Diagnostics' },
    ],
  },
  { id: 'user-shell-access', label: 'Shell Access' },
  { id: 'user-copy-files', label: 'Copy Files' },
];

interface PrivilegeNodeData {
  id: string;
  label: string;
  children?: PrivilegeNodeData[];
}

interface PrivilegeTreeItemProps {
  node: PrivilegeNodeData;
  selected: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}

function PrivilegeTreeItem({ node, selected, onToggle, depth = 0 }: PrivilegeTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isChecked = selected.has(node.id);

  return (
    <>
      <ListItem disablePadding sx={{ pl: depth * 2 }}>
        <ListItemButton dense onClick={() => hasChildren ? setExpanded(!expanded) : undefined}>
          {hasChildren && (
            <ListItemIcon sx={{ minWidth: 32 }}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListItemIcon>
          )}
          {!hasChildren && <Box sx={{ width: 32 }} />}
          <Checkbox
            checked={isChecked}
            onChange={() => onToggle(node.id)}
            size="small"
            edge="start"
          />
          <ListItemText primary={node.label} />
        </ListItemButton>
      </ListItem>
      {hasChildren && expanded && node.children!.map((child) => (
        <PrivilegeTreeItem
          key={child.id}
          node={child}
          selected={selected}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

// --- User Form Component ---

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: Partial<User>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function UserForm({ initialData, onSubmit, onCancel, isSubmitting }: UserFormProps) {
  const [username, setUsername] = useState(initialData?.username ?? '');
  const [fullName, setFullName] = useState(initialData?.full_name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [password, setPassword] = useState('');
  const disabled = initialData?.disabled ?? false;
  const [privileges, setPrivileges] = useState<Set<string>>(new Set(initialData?.privileges ?? []));

  const handlePrivilegeToggle = useCallback((id: string) => {
    setPrivileges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username,
      full_name: fullName,
      email,
      password: password || undefined,
      disabled,
      privileges: Array.from(privileges),
    });
  };

  return (
    <Stack spacing={2} component="form" onSubmit={handleSubmit}>
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        fullWidth
        size="small"
        disabled={!!initialData}
      />
      <TextField
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        fullWidth
        size="small"
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        size="small"
      />
      <TextField
        label={initialData ? 'New Password (leave blank to keep)' : 'Password'}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required={!initialData}
        fullWidth
        size="small"
      />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Privileges</Typography>
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense disablePadding>
            {PRIVILEGE_TREE.map((node) => (
              <PrivilegeTreeItem
                key={node.id}
                node={node}
                selected={privileges}
                onToggle={handlePrivilegeToggle}
              />
            ))}
          </List>
        </Paper>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save User'}
        </Button>
      </Box>
    </Stack>
  );
}

// --- Main Users Tab Component ---

export function UsersTab() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'users' | 'groups'>('users');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Group state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<UserGroup | null>(null);

  const usersQuery = useQuery({
    queryKey: systemQueryKeys.users,
    queryFn: fetchUsers,
  });

  const groupsQuery = useQuery({
    queryKey: systemQueryKeys.userGroups,
    queryFn: fetchUserGroups,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.users });
      setDialogOpen(false);
      setEditingUser(null);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ username, input }: { username: string; input: Partial<User> }) =>
      updateUser(username, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.users });
      setDialogOpen(false);
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.users });
      setDeleteTarget(null);
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: createUserGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.userGroups });
      setGroupDialogOpen(false);
      setEditingGroup(null);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ name, input }: { name: string; input: Partial<UserGroup> }) =>
      updateUserGroup(name, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.userGroups });
      setGroupDialogOpen(false);
      setEditingGroup(null);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteUserGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: systemQueryKeys.userGroups });
      setDeleteGroupTarget(null);
    },
  });

  const users = usersQuery.data?.data ?? [];
  const groups = groupsQuery.data?.data ?? [];

  const handleUserSubmit = (data: Partial<User>) => {
    if (editingUser) {
      updateUserMutation.mutate({ username: editingUser.username, input: data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_e, v) => setSubTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label="Users" value="users" />
        <Tab label="Groups" value="groups" />
      </Tabs>

      {subTab === 'users' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setEditingUser(null); setDialogOpen(true); }}
            >
              Add User
            </Button>
          </Box>

          {usersQuery.isLoading && (
            <Paper sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
            </Paper>
          )}

          {usersQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load users. Please try again.
            </Alert>
          )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
            <Paper><EmptyState message="No users found." /></Paper>
          )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Groups</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.username}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.disabled ? 'Disabled' : 'Active'}
                          color={user.disabled ? 'default' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {user.groups.length > 0 ? user.groups.join(', ') : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditingUser(user); setDialogOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(user)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {subTab === 'groups' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setEditingGroup(null); setGroupDialogOpen(true); }}
            >
              Add Group
            </Button>
          </Box>

          {groupsQuery.isLoading && (
            <Paper sx={{ p: 2 }}>
              {[...Array(3)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)}
            </Paper>
          )}

          {groupsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load groups. Please try again.
            </Alert>
          )}

          {!groupsQuery.isLoading && !groupsQuery.isError && groups.length === 0 && (
            <Paper><EmptyState message="No groups found." /></Paper>
          )}

          {!groupsQuery.isLoading && !groupsQuery.isError && groups.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.name}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.description || '-'}</TableCell>
                      <TableCell>
                        {group.members.length > 0 ? group.members.join(', ') : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditingGroup(group); setGroupDialogOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteGroupTarget(group)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* User Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <UserForm
            initialData={editingUser}
            onSubmit={handleUserSubmit}
            onCancel={() => setDialogOpen(false)}
            isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
          />
        </Box>
      </Dialog>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteTarget?.username}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) deleteUserMutation.mutate(deleteTarget.username); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Group Create/Edit Dialog (simplified) */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2} component="form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get('name') as string,
              description: formData.get('description') as string,
            };
            if (editingGroup) {
              updateGroupMutation.mutate({ name: editingGroup.name, input: data });
            } else {
              createGroupMutation.mutate(data);
            }
          }}>
            <TextField
              name="name"
              label="Group Name"
              defaultValue={editingGroup?.name ?? ''}
              required
              fullWidth
              size="small"
              disabled={!!editingGroup}
            />
            <TextField
              name="description"
              label="Description"
              defaultValue={editingGroup?.description ?? ''}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingGroup ? 'Update Group' : 'Create Group'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Dialog>

      {/* Delete Group Confirmation */}
      <ConfirmDialog
        open={deleteGroupTarget !== null}
        title="Delete Group"
        message={`Are you sure you want to delete group "${deleteGroupTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteGroupTarget) deleteGroupMutation.mutate(deleteGroupTarget.name); }}
        onCancel={() => setDeleteGroupTarget(null)}
      />
    </Box>
  );
}