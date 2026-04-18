import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Search, Edit, Trash2, Barcode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CategoryManagement from './CategoryManagement';
import { api } from '@/lib/api';
import type { Category, Product } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';

const ProductManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', barcode: '', category: '' });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const productsData = await api.getProducts();
      setProducts(productsData);
      if (isAdmin) {
        const categoriesData = await api.getCategories();
        setCategories(categoriesData);
      } else {
        setCategories([]);
      }
    } catch (error) {
      toast({ title: 'تعذر تحميل البيانات', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '', barcode: '', category: '' });
  };

  const generateBarcode = () => {
    const barcode = Math.floor(Math.random() * 1000000000).toString();
    setFormData((current) => ({ ...current, barcode }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({ title: 'خطأ في البيانات', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      barcode: formData.barcode,
      category: formData.category,
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        toast({ title: 'تم تحديث المنتج', description: `تم تحديث ${payload.name} بنجاح` });
      } else {
        await api.createProduct(payload);
        toast({ title: 'تم إضافة المنتج', description: `تم إضافة ${payload.name} بنجاح` });
      }
      await loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'تعذر حفظ المنتج', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      barcode: product.barcode || '',
      category: product.category || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProduct(id);
      await loadData();
      toast({ title: 'تم حذف المنتج', description: 'تم حذف المنتج بنجاح' });
    } catch (error) {
      toast({ title: 'تعذر حذف المنتج', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const filteredProducts = useMemo(() => products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  const getCategoryColor = (categoryName?: string) => categories.find((c) => c.name === categoryName)?.color || '#6B7280';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-cafe-brown-dark">إدارة المنتجات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cafe-brown to-[#7A3420] hover:from-cafe-brown hover:to-[#7A3420]" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />إضافة منتج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader><DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label htmlFor="name">اسم المنتج *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسم المنتج" required /></div>
              <div><Label htmlFor="price">السعر *</Label><Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" required /></div>
              <div><Label htmlFor="stock">الكمية المتوفرة</Label><Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" /></div>
              <div><Label htmlFor="barcode">الباركود</Label><div className="flex gap-2"><Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="الباركود" className="flex-1" /><Button type="button" variant="outline" onClick={generateBarcode}><Barcode className="w-4 h-4" /></Button></div></div>
              {isAdmin && (
                <div>
                  <Label htmlFor="category" className="mb-2 block">الفئة</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 pt-4"><Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">{editingProduct ? 'تحديث' : 'إضافة'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isAdmin && (
        <CategoryManagement
          categories={categories}
          onCreateCategory={async (data) => { await api.createCategory(data); await loadData(); }}
          onUpdateCategory={async (id, data, previousName) => { await api.updateCategory(id, { ...data, previousName }); await loadData(); }}
          onDeleteCategory={async (id) => { await api.deleteCategory(id); await loadData(); }}
        />
      )}

      <Card className="bg-white/60 backdrop-blur-sm border-cafe-beige"><CardContent className="pt-6"><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" /><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث عن المنتجات..." className="pr-10" /></div></CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-white/80 backdrop-blur-sm border-cafe-beige hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <CardTitle className="text-lg text-gray-800">{product.name}</CardTitle>
                {product.category && <Badge className="text-xs text-white border-0" style={{ backgroundColor: getCategoryColor(product.category) }}>{product.category}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>السعر:</span><span className="font-bold text-cafe-brown">{product.price.toFixed(2)} د.ل</span></div>
                <div className="flex justify-between"><span>المخزون:</span><span className="font-semibold">{product.stock}</span></div>
                {product.barcode && <div className="flex justify-between gap-3"><span>الباركود:</span><span className="font-mono text-xs">{product.barcode}</span></div>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => handleEdit(product)}><Edit className="w-4 h-4 mr-2" />تعديل</Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleDelete(product.id)}><Trash2 className="w-4 h-4 mr-2" />حذف</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && <Card className="bg-white/60 backdrop-blur-sm border-cafe-beige"><CardContent className="py-12 text-center text-gray-500"><Package className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>لا توجد منتجات مطابقة</p></CardContent></Card>}
    </div>
  );
};

export default ProductManagement;