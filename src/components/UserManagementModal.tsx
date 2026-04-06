'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Add,
  Edit,
  Delete,
  Search,
  Person,
  Email,
  Lock,
  Badge,
} from '@mui/icons-material';
import { Chip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { closeModal, setMode, setSelectedUser, showToast, hideToast } from '@/lib/store/userModalSlice';

interface User {
  id: string;
  email: string;
  role: string;
  permissionScope?: {
    allowed?: string[];
    denied?: string[];
  };
  effectivePermissions?: string[];
  createdAt?: string;
}

const ROLES = ['admin', 'treasurer', 'secretary', 'member'];

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard.view', label: 'Dashboard' },
  { key: 'members.view', label: 'View Members' },
  { key: 'members.create', label: 'Create Members' },
  { key: 'members.edit', label: 'Edit Members' },
  { key: 'members.delete', label: 'Delete Members' },
  { key: 'contributions.view', label: 'View Contributions' },
  { key: 'contributions.create', label: 'Record Contributions' },
  { key: 'loans.view', label: 'View Loans' },
  { key: 'loans.create', label: 'Create Loans' },
  { key: 'loans.approve', label: 'Approve Loans' },
  { key: 'loans.disburse', label: 'Disburse Loans' },
  { key: 'savings.view', label: 'View Savings' },
  { key: 'savings.create', label: 'Manage Savings' },
  { key: 'savings.addTransaction', label: 'Add Transaction' },
  { key: 'welfare.view', label: 'View Welfare' },
  { key: 'welfare.create', label: 'Manage Welfare' },
  { key: 'welfare.approve', label: 'Approve Welfare' },
  { key: 'reports.view', label: 'View Reports' },
  { key: 'meetings.view', label: 'View Meetings' },
  { key: 'meetings.create', label: 'Create Meetings' },
  { key: 'announcements.view', label: 'View Announcements' },
  { key: 'announcements.create', label: 'Create Announcements' },
  { key: 'settings.view', label: 'View Settings' },
  { key: 'settings.edit', label: 'Edit Settings' },
  { key: 'users.view', label: 'View Users' },
  { key: 'users.create', label: 'Create Users' },
  { key: 'users.edit', label: 'Edit Users' },
  { key: 'users.delete', label: 'Delete Users' },
];

const ITEMS_PER_PAGE = 5;

export default function UserManagementModal() {
  const dispatch = useAppDispatch();
  const { isOpen, mode, selectedUser, toast } = useAppSelector((state) => state.userModal);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'member',
    permissionScope: {
      allowed: [] as string[],
      denied: [] as string[],
    },
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        dispatch(showToast({ message: data.error || 'Failed to fetch users', severity: 'error' }));
      }
    } catch (error) {
      dispatch(showToast({ message: 'Failed to fetch users', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchQuery
      ? user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const validateForm = (isEdit: boolean): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }
    }

    if (!isEdit && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    } else if (!ROLES.includes(formData.role)) {
      errors.role = 'Invalid role';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = mode === 'edit';

    if (!validateForm(isEdit)) return;

    setSubmitting(true);
    try {
      if (mode === 'add') {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
            permissionScope: formData.permissionScope,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          dispatch(showToast({ message: 'User created successfully', severity: 'success' }));
          await fetchUsers();
          handleClose();
        } else {
          dispatch(showToast({ message: data.error || 'Failed to create user', severity: 'error' }));
        }
      } else if (mode === 'edit' && selectedUser) {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password || undefined,
            role: formData.role,
            permissionScope: formData.permissionScope,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          dispatch(showToast({ message: 'User updated successfully', severity: 'success' }));
          await fetchUsers();
          handleClose();
        } else {
          dispatch(showToast({ message: data.error || 'Failed to update user', severity: 'error' }));
        }
      }
    } catch (error) {
      dispatch(showToast({ message: 'An error occurred', severity: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        dispatch(showToast({ message: 'User deleted successfully', severity: 'success' }));
        await fetchUsers();
      } else {
        dispatch(showToast({ message: data.error || 'Failed to delete user', severity: 'error' }));
      }
    } catch (error) {
      dispatch(showToast({ message: 'Failed to delete user', severity: 'error' }));
    } finally {
      setSubmitting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleClose = () => {
    dispatch(closeModal());
    setFormData({ 
      email: '', 
      password: '', 
      role: 'member',
      permissionScope: { allowed: [], denied: [] },
    });
    setFormErrors({});
    setSearchQuery('');
    setRoleFilter('');
    setPage(0);
    setDeleteConfirmId(null);
  };

  const handleAddClick = () => {
    dispatch(setMode('add'));
    setFormData({ 
      email: '', 
      password: '', 
      role: 'member',
      permissionScope: { allowed: [], denied: [] },
    });
    setFormErrors({});
  };

  const handleEditClick = (user: User) => {
    dispatch(setSelectedUser({ id: user.id, email: user.email, role: user.role }));
    dispatch(setMode('edit'));
    setFormData({ 
      email: user.email, 
      password: '', 
      role: user.role,
      permissionScope: { 
        allowed: user.permissionScope?.allowed || [], 
        denied: user.permissionScope?.denied || [] 
      },
    });
    setFormErrors({});
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            <Typography variant="h6" component="span" fontWeight={600}>
              User Management
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {mode === 'list' && (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  size="small"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter by Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Filter by Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    {ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddClick}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Add User
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No users found
                </Box>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedUsers.map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Box
                                component="span"
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  bgcolor:
                                    user.role === 'admin'
                                      ? '#E3F2FD'
                                      : user.role === 'treasurer'
                                      ? '#FFF3E0'
                                      : user.role === 'secretary'
                                      ? '#F3E5F5'
                                      : '#E8F5E9',
                                  color:
                                    user.role === 'admin'
                                      ? '#1565C0'
                                      : user.role === 'treasurer'
                                      ? '#E65100'
                                      : user.role === 'secretary'
                                      ? '#7B1FA2'
                                      : '#2E7D32',
                                }}
                              >
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(user.effectivePermissions || []).slice(0, 4).map((perm) => (
                                  <Chip
                                    key={perm}
                                    label={perm.split('.')[1]}
                                    size="small"
                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                  />
                                ))}
                                {(user.effectivePermissions || []).length > 4 && (
                                  <Chip
                                    label={`+${(user.effectivePermissions || []).length - 4}`}
                                    size="small"
                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                    color="default"
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditClick(user)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeleteConfirmId(user.id)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredUsers.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={ITEMS_PER_PAGE}
                    rowsPerPageOptions={[ITEMS_PER_PAGE]}
                  />
                </>
              )}
            </>
          )}

          {(mode === 'add' || mode === 'edit') && (
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  fullWidth
                  required
                  disabled={submitting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label={mode === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={!!formErrors.password}
                  helperText={formErrors.password || (mode === 'add' ? 'Minimum 8 characters' : 'Minimum 8 characters if changing')}
                  fullWidth
                  required={mode === 'add'}
                  disabled={submitting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl fullWidth error={!!formErrors.role}>
                  <InputLabel>Role *</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role *"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={submitting}
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Badge sx={{ fontSize: '0.875rem' }} />
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {formErrors.role}
                    </Typography>
                  )}
                </FormControl>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                  Permission Scope
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  By default, users get permissions based on their role. You can customize which permissions to allow or deny.
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Allowed Permissions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <Chip
                        key={perm.key}
                        label={perm.label}
                        size="small"
                        onClick={() => {
                          const allowed = formData.permissionScope.allowed;
                          if (allowed.includes(perm.key)) {
                            setFormData({
                              ...formData,
                              permissionScope: {
                                ...formData.permissionScope,
                                allowed: allowed.filter((p) => p !== perm.key),
                              },
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissionScope: {
                                ...formData.permissionScope,
                                allowed: [...allowed, perm.key],
                              },
                            });
                          }
                        }}
                        color={formData.permissionScope.allowed.includes(perm.key) ? 'primary' : 'default'}
                        variant={formData.permissionScope.allowed.includes(perm.key) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Denied Permissions (overrides allowed)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <Chip
                        key={`denied-${perm.key}`}
                        label={perm.label}
                        size="small"
                        onClick={() => {
                          const denied = formData.permissionScope.denied;
                          if (denied.includes(perm.key)) {
                            setFormData({
                              ...formData,
                              permissionScope: {
                                ...formData.permissionScope,
                                denied: denied.filter((p) => p !== perm.key),
                              },
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissionScope: {
                                ...formData.permissionScope,
                                denied: [...denied, perm.key],
                              },
                            });
                          }
                        }}
                        color={formData.permissionScope.denied.includes(perm.key) ? 'error' : 'default'}
                        variant={formData.permissionScope.denied.includes(perm.key) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {mode === 'list' ? (
            <Button onClick={handleClose} variant="outlined">
              Close
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  dispatch(setMode('list'));
                  setFormData({ 
                    email: '', 
                    password: '', 
                    role: 'member',
                    permissionScope: { allowed: [], denied: [] },
                  });
                  setFormErrors({});
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : mode === 'add' ? (
                  'Create User'
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            color="error"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast?.open}
        autoHideDuration={4000}
        onClose={() => dispatch(hideToast())}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => dispatch(hideToast())}
          severity={toast?.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
}