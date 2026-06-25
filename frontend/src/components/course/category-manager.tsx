'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, Trash2, Edit2, Folder, Loader2, 
  GripVertical, ChevronDown, ChevronRight
} from 'lucide-react';

interface CategoryManagerProps {
  accessToken?: string;
}

export function CategoryManager({ accessToken }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories, isLoading } = useCategories();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const handleCreate = (data: any) => {
    createCategoryMutation.mutate(data, {
      onSuccess: () => {
        invalidate();
        setEditingCategory(null);
      },
    });
  };

  const handleUpdate = (id: string, data: any) => {
    updateCategoryMutation.mutate({ id, data }, {
      onSuccess: () => {
        invalidate();
        setEditingCategory(null);
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteCategoryMutation.mutate(id, {
      onSuccess: () => {
        invalidate();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <p className="text-muted-foreground">Organize courses into categories</p>
        </div>
        <Button onClick={() => setEditingCategory({})}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.slug}</p>
                </div>
                {category.description && (
                  <Badge variant="outline" className="ml-2">
                    {category.description}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!categories || categories.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No categories yet</p>
              <Button onClick={() => setEditingCategory({})}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Editor Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory?.id ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory?.id ? 'Update the category details below.' : 'Create a new course category.'}
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryEditor
              category={editingCategory}
              onSave={(data) => {
                if (editingCategory.id) {
                  handleUpdate(editingCategory.id, data);
                } else {
                  handleCreate(data);
                }
              }}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CategoryEditorProps {
  category: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function CategoryEditor({ category, onSave, onCancel }: CategoryEditorProps) {
  const [name, setName] = useState(category.name || '');
  const [slug, setSlug] = useState(category.slug || '');
  const [description, setDescription] = useState(category.description || '');
  const [icon, setIcon] = useState(category.icon || '');

  const handleSave = () => {
    onSave({ name, slug, description, icon });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryName">Name</Label>
        <Input
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Web Development"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categorySlug">Slug</Label>
        <Input
          id="categorySlug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          placeholder="web-development"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryDescription">Description</Label>
        <Textarea
          id="categoryDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of this category"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryIcon">Icon URL (Optional)</Label>
        <Input
          id="categoryIcon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="https://example.com/icon.svg"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
