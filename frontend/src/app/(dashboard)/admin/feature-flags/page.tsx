'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Flag, PlusCircle, Edit, Trash2, Search } from 'lucide-react';

export default function AdminFeatureFlags() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [editingFlag, setEditingFlag] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState<any>(null);
  const [flagForm, setFlagForm] = useState({
    key: '',
    name: '',
    description: '',
    environment: 'DEVELOPMENT',
    isEnabled: false,
  });

  const { data: flags, isLoading, refetch } = useQuery({
    queryKey: ['admin-feature-flags', searchQuery, statusFilter, environmentFilter],
    queryFn: () => {
      let url = '/admin/feature-flags';
      if (searchQuery) url += `?search=${searchQuery}`;
      if (statusFilter !== 'all') url += `${searchQuery ? '&' : '?'}status=${statusFilter}`;
      if (environmentFilter !== 'all') url += `${searchQuery || statusFilter !== 'all' ? '&' : '?'}environment=${environmentFilter}`;
      return api.get(url, { token: accessToken || undefined });
    },
    enabled: !!accessToken,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      api.patch(`/admin/feature-flags/${id}`, { isEnabled }, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/admin/feature-flags', data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setIsCreating(false);
      setFlagForm({
        key: '',
        name: '',
        description: '',
        environment: 'DEVELOPMENT',
        isEnabled: false,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/admin/feature-flags/${id}`, data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setEditDialogOpen(false);
      setEditingFlag(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/admin/feature-flags/${id}`, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      setDeleteDialogOpen(false);
      setFlagToDelete(null);
    },
  });

  const handleCreateFlag = () => {
    createMutation.mutate(flagForm);
  };

  const handleEditFlag = (flag: any) => {
    setEditingFlag(flag);
    setFlagForm({
      key: flag.key || '',
      name: flag.name || '',
      description: flag.description || '',
      environment: flag.environment || 'DEVELOPMENT',
      isEnabled: flag.isEnabled || false,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingFlag) {
      updateMutation.mutate({
        id: editingFlag.id,
        data: flagForm,
      });
    }
  };

  const handleDeleteFlag = (flag: any) => {
    setFlagToDelete(flag);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (flagToDelete) {
      deleteMutation.mutate(flagToDelete.id);
    }
  };

  const filteredFlags = Array.isArray(flags) ? flags.filter((flag: any) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !flag.isEnabled) return false;
      if (statusFilter === 'inactive' && flag.isEnabled) return false;
    }
    if (environmentFilter !== 'all' && flag.environment !== environmentFilter) return false;
    if (searchQuery && !flag.key.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !flag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !flag.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground mt-1">Manage feature toggles</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Flag
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search flags..." 
            className="w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="environment-filter">Environment:</Label>
          <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
            <SelectTrigger id="environment-filter" className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="DEVELOPMENT">Development</SelectItem>
              <SelectItem value="STAGING">Staging</SelectItem>
              <SelectItem value="PRODUCTION">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Feature Flag</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateFlag(); }}>
              <div>
                <Label htmlFor="key">Key</Label>
                <Input 
                  id="key" 
                  placeholder="NEW_DASHBOARD_UI"
                  value={flagForm.key}
                  onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Feature Name"
                  value={flagForm.name}
                  onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the feature" 
                  rows={3}
                  value={flagForm.description}
                  onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select value={flagForm.environment} onValueChange={(value) => setFlagForm({ ...flagForm, environment: value })}>
                  <SelectTrigger id="environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEVELOPMENT">Development</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isEnabled">Enable Flag</Label>
                <Switch 
                  id="isEnabled"
                  checked={flagForm.isEnabled}
                  onCheckedChange={(checked) => setFlagForm({ ...flagForm, isEnabled: checked })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : Array.isArray(filteredFlags) && filteredFlags.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Feature Flags ({filteredFlags.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFlags.map((flag: any) => (
                <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Flag className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{flag.name}</h3>
                        <Badge variant={flag.isEnabled ? 'default' : 'secondary'}>
                          {flag.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {flag.environment}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.key}</p>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={flag.isEnabled}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: flag.id, isEnabled: checked })}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditFlag(flag)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Flag
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteFlag(flag)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Flag
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
        <Card className="cursor-pointer" onClick={() => setIsCreating(true)}>
          <CardContent className="p-12 text-center">
            <Flag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No feature flags yet</h3>
            <p className="text-muted-foreground mb-4">
              Create feature flags to control feature availability
            </p>
            <Button variant="outline" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Your First Flag
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Flag Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-key">Key</Label>
              <Input
                id="edit-key"
                value={flagForm.key}
                onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={flagForm.name}
                onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={flagForm.description}
                onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-environment">Environment</Label>
              <Select value={flagForm.environment} onValueChange={(value) => setFlagForm({ ...flagForm, environment: value })}>
                <SelectTrigger id="edit-environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVELOPMENT">Development</SelectItem>
                  <SelectItem value="STAGING">Staging</SelectItem>
                  <SelectItem value="PRODUCTION">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isEnabled">Enable Flag</Label>
              <Switch
                id="edit-isEnabled"
                checked={flagForm.isEnabled}
                onCheckedChange={(checked) => setFlagForm({ ...flagForm, isEnabled: checked })}
              />
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

      {/* Delete Flag Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this feature flag?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the feature flag
              and may affect feature availability in your application.
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
    </div>
  );
}
