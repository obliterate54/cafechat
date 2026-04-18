import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Barcode, Plus, Minus, Trash2, Printer, Receipt, PlayCircle, StopCircle, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { CartItem, Product, SaleInvoice, SalesSession } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';
import { printSaleReceipt } from '@/lib/receipt';

const SalesInterface = () => {
  const { user } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSession, setActiveSession] = useState<SalesSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SalesSession[]>([]);
  const [sessionComment, setSessionComment] = useState('');
  const [editingSession, setEditingSession] = useState<SalesSession | null>(null);
  const [latestInvoice, setLatestInvoice] = useState<SaleInvoice | null>(null);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setProducts(await api.getProducts());
    } catch (error) {
      toast({ title: 'تعذر تحميل المنتجات', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const loadSessions = async () => {
    try {
      const [active, history] = await Promise.all([api.getActiveSalesSession(), api.getSalesSessions()]);
      setActiveSession(active.session);
      setSessionHistory(history);
    } catch (error) {
      toast({ title: 'تعذر تحميل الجلسات', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadProducts();
    loadSessions();
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
    if (!product) {
      toast({ title: 'المنتج غير موجود', description: 'لم يتم العثور على منتج بهذا الباركود', variant: 'destructive' });
      return;
    }
    addToCart(product);
    setBarcode('');
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
      const created = await api.createSale({
        invoiceNumber,
        date,
        time,
        items: cart,
        total: calculateTotal(),
        cashier: user?.displayName || 'الكاشير',
        sessionId: activeSession?.id || null,
      });
      setLatestInvoice(created);
      toast({ title: 'تمت عملية البيع بنجاح', description: `رقم الفاتورة: ${invoiceNumber} - المبلغ: ${calculateTotal().toFixed(2)} د.ل` });
      setCart([]);
      await Promise.all([loadProducts(), loadSessions()]);
    } catch (error) {
      toast({ title: 'تعذر إتمام البيع', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const startSession = async () => {
    try {
      await api.startSalesSession(sessionComment);
      setSessionComment('');
      setIsStartDialogOpen(false);
      await loadSessions();
      toast({ title: 'تم بدء الجلسة', description: 'يمكن الآن ربط المبيعات بهذه الجلسة' });
    } catch (error) {
      toast({ title: 'تعذر بدء الجلسة', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    try {
      await api.endSalesSession(activeSession.id, sessionComment);
      setSessionComment('');
      setIsEndDialogOpen(false);
      await loadSessions();
      toast({ title: 'تم إنهاء الجلسة', description: 'تم حفظ ملخص الجلسة والتعليقات' });
    } catch (error) {
      toast({ title: 'تعذر إنهاء الجلسة', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const saveSessionComments = async () => {
    if (!editingSession) return;
    try {
      await api.updateSalesSessionComments(editingSession.id, sessionComment);
      setIsCommentsDialogOpen(false);
      setEditingSession(null);
      setSessionComment('');
      await loadSessions();
      toast({ title: 'تم حفظ التعليقات', description: 'تم تحديث ملاحظات الجلسة بنجاح' });
    } catch (error) {
      toast({ title: 'تعذر حفظ التعليقات', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const filteredProducts = useMemo(() => products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-blue-800 flex items-center gap-2"><History className="w-5 h-5" />جلسات البيع</CardTitle>
              {activeSession ? (
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div>جلسة نشطة بدأت: {new Date(activeSession.startedAt).toLocaleString('ar-SA')}</div>
                  <div>الفواتير: {activeSession.totalInvoices} | القطع: {activeSession.totalItems} | الإجمالي: {activeSession.totalSalesAmount.toFixed(2)} د.ل</div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">لا توجد جلسة نشطة الآن. يمكنك البيع بدون جلسة، لكن التتبع سيكون أفضل مع الجلسات.</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => { setSessionComment(''); setIsStartDialogOpen(true); }} disabled={!!activeSession} className="bg-green-600 hover:bg-green-700"><PlayCircle className="w-4 h-4 ml-2" />بدء جلسة</Button>
              <Button onClick={() => { setSessionComment(activeSession?.comments || ''); setIsEndDialogOpen(true); }} disabled={!activeSession} variant="destructive"><StopCircle className="w-4 h-4 ml-2" />إنهاء الجلسة</Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Barcode className="w-5 h-5" />قارئ الباركود</CardTitle></CardHeader>
            <CardContent><form onSubmit={handleBarcodeSubmit} className="flex gap-2"><Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="امسح الباركود أو اكتبه..." className="flex-1 text-center font-mono text-lg" autoFocus /><Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">إضافة</Button></form></CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Search className="w-5 h-5" />المنتجات المتاحة</CardTitle><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ابحث عن المنتجات..." className="mt-2" /></CardHeader>
            <CardContent><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{filteredProducts.map((product) => <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-100 hover:border-blue-300" onClick={() => addToCart(product)}><CardContent className="p-4 text-center"><h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3><p className="text-lg font-bold text-blue-600 mb-2">{product.price.toFixed(2)} د.ل</p><Badge variant="secondary" className="text-xs">متوفر: {product.stock}</Badge></CardContent></Card>)}</div></CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader><CardTitle className="text-blue-800">سجل الجلسات</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {sessionHistory.map((session) => (
                  <div key={session.id} className="p-3 rounded-lg border border-blue-100 bg-white/80">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-1 text-sm">
                        <div className="font-semibold">{session.status === 'active' ? 'جلسة نشطة' : 'جلسة مغلقة'}</div>
                        <div>من: {new Date(session.startedAt).toLocaleString('ar-SA')}</div>
                        {session.endedAt && <div>إلى: {new Date(session.endedAt).toLocaleString('ar-SA')}</div>}
                        <div>الفواتير: {session.totalInvoices} | الإجمالي: {session.totalSalesAmount.toFixed(2)} د.ل</div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant={session.status === 'active' ? 'secondary' : 'outline'}>{session.status === 'active' ? 'نشطة' : 'مغلقة'}</Badge>
                        <Button variant="outline" size="sm" onClick={() => { setEditingSession(session); setSessionComment(session.comments || ''); setIsCommentsDialogOpen(true); }}>تعديل التعليق</Button>
                      </div>
                    </div>
                    {session.comments && <p className="text-sm text-gray-600 mt-2">ملاحظة: {session.comments}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 sticky top-24">
            <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Receipt className="w-5 h-5" />سلة المشتريات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? <p className="text-center text-gray-500 py-8">السلة فارغة</p> : <>
                <div className="space-y-3 max-h-96 overflow-y-auto">{cart.map((item) => <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg gap-2"><div className="flex-1"><h4 className="font-semibold text-gray-800">{item.name}</h4><p className="text-sm text-blue-600">{item.price.toFixed(2)} د.ل</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button><span className="w-8 text-center font-semibold">{item.quantity}</span><Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button><Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="w-3 h-3" /></Button></div></div>)}</div>
                <Separator />
                <div className="space-y-3"><div className="flex justify-between items-center text-lg font-bold"><span>الإجمالي:</span><span className="text-blue-600">{calculateTotal().toFixed(2)} د.ل</span></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" className="border-blue-200 hover:bg-blue-50" disabled={!latestInvoice} onClick={() => latestInvoice && printSaleReceipt(latestInvoice)}><Printer className="w-4 h-4 mr-2" />طباعة</Button><Button onClick={handleCheckout} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">إتمام البيع</Button></div></div>
              </>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>بدء جلسة جديدة</DialogTitle></DialogHeader><div className="space-y-4"><Textarea value={sessionComment} onChange={(e) => setSessionComment(e.target.value)} placeholder="تعليق اختياري عند بداية الجلسة" /><Button onClick={startSession} className="w-full">ابدأ الجلسة</Button></div></DialogContent>
      </Dialog>
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>إنهاء الجلسة الحالية</DialogTitle></DialogHeader><div className="space-y-4"><Textarea value={sessionComment} onChange={(e) => setSessionComment(e.target.value)} placeholder="اكتب ملاحظات الإغلاق" /><Button onClick={endSession} className="w-full bg-red-600 hover:bg-red-700">إنهاء الجلسة</Button></div></DialogContent>
      </Dialog>
      <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>تعديل تعليق الجلسة</DialogTitle></DialogHeader><div className="space-y-4"><Textarea value={sessionComment} onChange={(e) => setSessionComment(e.target.value)} placeholder="تعليق الجلسة" /><Button onClick={saveSessionComments} className="w-full">حفظ التعديلات</Button></div></DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesInterface;