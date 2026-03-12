import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Barcode, Plus, Minus, Trash2, Printer, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { CartItem, Product } from '@/types/pos';

const SalesInterface = () => {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      toast({ title: 'تعذر تحميل المنتجات', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: 'المنتج غير متوفر', description: `المخزون منتهي للمنتج ${product.name}`, variant: 'destructive' });
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    const currentQty = existingItem?.quantity || 0;

    if (currentQty + 1 > product.stock) {
      toast({ title: 'مخزون غير كافٍ', description: `الحد الأقصى المتوفر هو ${product.stock}`, variant: 'destructive' });
      return;
    }

    if (existingItem) {
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, barcode: product.barcode, quantity: 1 }]);
    }

    toast({ title: 'تم إضافة المنتج', description: `تم إضافة ${product.name} إلى السلة` });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.id !== id));
      return;
    }

    if (newQuantity > product.stock) {
      toast({ title: 'مخزون غير كافٍ', description: `الحد الأقصى المتوفر هو ${product.stock}`, variant: 'destructive' });
      return;
    }

    setCart(cart.map((item) => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  const removeFromCart = (id: string) => setCart(cart.filter((item) => item.id !== id));

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((item) => item.barcode === barcode);
    if (product) {
      addToCart(product);
      setBarcode('');
    } else {
      toast({ title: 'المنتج غير موجود', description: 'لم يتم العثور على منتج بهذا الباركود', variant: 'destructive' });
    }
  };

  const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: 'السلة فارغة', description: 'يرجى إضافة منتجات إلى السلة أولاً', variant: 'destructive' });
      return;
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const invoiceNumber = `INV-${date.replace(/-/g, '')}-${now.getTime().toString().slice(-4)}`;

    try {
      await api.createSale({
        invoiceNumber,
        date,
        time,
        items: cart,
        total: calculateTotal(),
        cashier: 'البائع الرئيسي',
      });
      toast({ title: 'تمت عملية البيع بنجاح', description: `رقم الفاتورة: ${invoiceNumber} - المبلغ: ${calculateTotal().toFixed(2)} ريال` });
      setCart([]);
      await loadProducts();
    } catch (error) {
      toast({ title: 'تعذر إتمام البيع', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const filteredProducts = useMemo(() => products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800"><Barcode className="w-5 h-5" />قارئ الباركود</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="امسح الباركود أو اكتبه..." className="flex-1 text-center font-mono text-lg" autoFocus />
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">إضافة</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800"><Search className="w-5 h-5" />المنتجات المتاحة</CardTitle>
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث عن المنتجات..." className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-100 hover:border-blue-300" onClick={() => addToCart(product)}>
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                      <p className="text-lg font-bold text-blue-600 mb-2">{product.price.toFixed(2)} ريال</p>
                      <Badge variant="secondary" className="text-xs">متوفر: {product.stock}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800"><Receipt className="w-5 h-5" />سلة المشتريات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? <p className="text-center text-gray-500 py-8">السلة فارغة</p> : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          <p className="text-sm text-blue-600">{item.price.toFixed(2)} ريال</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold"><span>الإجمالي:</span><span className="text-blue-600">{calculateTotal().toFixed(2)} ريال</span></div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="border-blue-200 hover:bg-blue-50"><Printer className="w-4 h-4 mr-2" />طباعة</Button>
                      <Button onClick={handleCheckout} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">إتمام البيع</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesInterface;
