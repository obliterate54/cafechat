import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Tag, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/types/pos';

interface CategoryManagementProps {
  categories: Category[];
  onCreateCategory: (data: Omit<Category, 'id'>) => Promise<void>;
  onUpdateCategory: (id: string, data: Omit<Category, 'id'>, previousName: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const CategoryManagement = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });
  const { toast } = useToast();

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال اسم الفئة',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, formData, editingCategory.name);
        toast({ title: 'تم تحديث الفئة', description: `تم تحديث فئة ${formData.name} بنجاح` });
      } else {
        await onCreateCategory(formData);
        toast({ title: 'تم إضافة الفئة', description: `تم إضافة فئة ${formData.name} بنجاح` });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'تعذر حفظ الفئة',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteCategory(id);
      toast({ title: 'تم حذف الفئة', description: 'تم حذف الفئة بنجاح' });
    } catch (error) {
      toast({
        title: 'تعذر حذف الفئة',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-cafe-beige">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-cafe-brown-dark">
            <Tag className="w-5 h-5" />
            إدارة الفئات
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-cafe-sand hover:bg-cafe-cream"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة فئة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">اسم الفئة *</Label>
                  <Input
                    id="categoryName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الفئة"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDescription">الوصف</Label>
                  <Input
                    id="categoryDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="وصف اختياري"
                  />
                </div>
                <div>
                  <Label className="mb-3 block">لون الفئة</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-full h-10 rounded-lg border-2 ${formData.color === color ? 'border-gray-800 scale-105' : 'border-gray-200'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                    {editingCategory ? 'تحديث' : 'إضافة'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="bg-white/80 border-cafe-beige">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                    <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {category.description && <p className="text-sm text-gray-600 mb-3">{category.description}</p>}

                <Badge variant="secondary" className="bg-cafe-cream text-blue-700">
                  <Package className="w-3 h-3 mr-1" />
                  فئة محفوظة
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد فئات حتى الآن</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryManagement;
