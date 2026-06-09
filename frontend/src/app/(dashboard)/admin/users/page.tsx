'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Search, MoreHorizontal, Edit, Trash2, Power } from 'lucide-react';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminUsers() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateSort, setDateSort] = useState('newest');
  const [nameSort, setNameSort] = useState('none');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [createStudentDialogOpen, setCreateStudentDialogOpen] = useState(false);
  const [createStudentForm, setCreateStudentForm] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const { data: usersResponse, isLoading, error } = useQuery<PaginatedResponse<any>>({
    queryKey: ['admin-users', searchQuery, roleFilter, dateSort, nameSort],
    queryFn: () => {
      let url = '/admin/users?page=1&limit=20';
      if (searchQuery) url += `&search=${searchQuery}`;
      if (roleFilter !== 'all') url += `&role=${roleFilter.toUpperCase()}`;
      if (dateSort && dateSort !== 'newest') url += `&dateSort=${dateSort}`;
      if (nameSort && nameSort !== 'none') url += `&nameSort=${nameSort}`;
      return api.get(url, { token: accessToken || undefined });
    },
    enabled: !!accessToken,
    retry: 1,
  });

  const users = usersResponse?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/admin/users/${id}`, data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditDialogOpen(false);
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/admin/users/${id}`, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/users/${id}`, { isActive }, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/admin/users', { ...data, roles: ['STUDENT'] }, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateStudentDialogOpen(false);
      setCreateStudentForm({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        password: '',
      });
    },
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.username || '',
      email: user.email || '',
      role: user.roles?.[0] || 'STUDENT',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          username: editForm.name,
          email: editForm.email,
          roles: [editForm.role],
        },
      });
    }
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const handleToggleStatus = (user: any) => {
    toggleStatusMutation.mutate({
      id: user.id,
      isActive: !user.isActive,
    });
  };

  const handleCreateStudent = () => {
    createStudentMutation.mutate(createStudentForm);
  };

  const sortedUsers = users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage platform users</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search users..." 
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={() => setCreateStudentDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="role-filter">Filter by Role:</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger id="role-filter" className="w-[180px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (Both)</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="date-sort">Sort by Date:</Label>
          <Select value={dateSort} onValueChange={setDateSort}>
            <SelectTrigger id="date-sort" className="w-[180px]">
              <SelectValue placeholder="Date Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="name-sort">Sort Alphabetically:</Label>
          <Select value={nameSort} onValueChange={setNameSort}>
            <SelectTrigger id="name-sort" className="w-[180px]">
              <SelectValue placeholder="Name Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="asc">Name A-Z</SelectItem>
              <SelectItem value="desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : Array.isArray(sortedUsers) && sortedUsers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Users ({usersResponse?.meta?.total || sortedUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex gap-2 mt-1">
                        {user.roles?.map((role: string) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.isEmailVerified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          <Power className="h-4 w-4 mr-2" />
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              Users will appear here when they register on the platform
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Student Dialog */}
      <Dialog open={createStudentDialogOpen} onOpenChange={setCreateStudentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createStudentForm.email}
                onChange={(e) => setCreateStudentForm({ ...createStudentForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={createStudentForm.username}
                onChange={(e) => setCreateStudentForm({ ...createStudentForm, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-firstname">First Name</Label>
              <Input
                id="create-firstname"
                value={createStudentForm.firstName}
                onChange={(e) => setCreateStudentForm({ ...createStudentForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-lastname">Last Name</Label>
              <Input
                id="create-lastname"
                value={createStudentForm.lastName}
                onChange={(e) => setCreateStudentForm({ ...createStudentForm, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createStudentForm.password}
                onChange={(e) => setCreateStudentForm({ ...createStudentForm, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateStudentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStudent} disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
