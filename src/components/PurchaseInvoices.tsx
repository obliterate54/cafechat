import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Calendar, Building, Receipt, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Category, InvoiceItem, PurchaseInvoice } from '@/types/pos';

const emptyItem: InvoiceItem = { index: '', productName: '', barcode: '', quantity: 0, purchasePrice: 0, salePrice: 0, category: '' };

const PurchaseInvoices = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ invoiceNumber: '', supplier: '', date: '' });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ ...emptyItem }]);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [categoriesData, invoicesData] = await Promise.all([api.getCategories(), api.getPurchases()]);
      setCategories(categoriesData);
      setInvoices(invoicesData);
    } catch (error) {
      toast({ title: 'تعذر تحميل البيانات', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  useEffect(() => { loadData(); }, []);

  const addInvoiceItem = () => setInvoiceItems([...invoiceItems, { ...emptyItem }]);
  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => setInvoiceItems(invoiceItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeInvoiceItem = (index: number) => { if (invoiceItems.length > 1) setInvoiceItems(invoiceItems.filter((_, i) => i !== index)); };
  const calculateTotal = () => invoiceItems.reduce((total, item) => total + item.quantity * item.purchasePrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceData.invoiceNumber || !invoiceData.supplier || !invoiceData.date) {
      toast({ title: 'خطأ في البيانات', description: 'يرجى ملء جميع بيانات الفاتورة', variant: 'destructive' });
      return;
    }

    const validItems = invoiceItems.filter((item) => item.productName && item.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: 'خطأ في البيانات', description: 'يرجى إضافة منتج واحد على الأقل', variant: 'destructive' });
      return;
    }

    try {
      await api.createPurchase({ ...invoiceData, time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }), items: validItems, total: calculateTotal() });
      await loadData();
      toast({ title: 'تم إضافة الفاتورة', description: `تم إضافة فاتورة الشراء ${invoiceData.invoiceNumber} بنجاح` });
      setIsAddDialogOpen(false);
      setInvoiceData({ invoiceNumber: '', supplier: '', date: '' });
      setInvoiceItems([{ ...emptyItem }]);
    } catch (error) {
      toast({ title: 'تعذر حفظ الفاتورة', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const handleDeleteInvoice = async (invoice: PurchaseInvoice) => {
    if (!window.confirm(`هل تريد حذف فاتورة الشراء ${invoice.invoiceNumber}؟`)) return;
    try {
      await api.deletePurchase(invoice.id);
      if (selectedInvoice?.id === invoice.id) setIsInvoiceDialogOpen(false);
      await loadData();
      toast({ title: 'تم حذف الفاتورة', description: 'تم حذف فاتورة الشراء بنجاح' });
    } catch (error) {
      toast({ title: 'تعذر حذف الفاتورة', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  const getCategoryColor = (categoryName: string) => categories.find((c) => c.name === categoryName)?.color || '#6B7280';

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><CardTitle className="flex items-center gap-2 text-blue-800"><FileText className="w-6 h-6" />فواتير الشراء</CardTitle><p className="text-sm text-gray-600 mt-1">إجمالي الفواتير: {invoices.length} فاتورة</p></div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"><Plus className="w-4 h-4 mr-2" />إضافة فاتورة شراء</Button></DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader><DialogTitle>إضافة فاتورة شراء جديدة</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label htmlFor="invoiceNumber">رقم الفاتورة *</Label><Input id="invoiceNumber" value={invoiceData.invoiceNumber} onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} placeholder="INV-001" required /></div>
                    <div><Label htmlFor="supplier">المورد *</Label><Input id="supplier" value={invoiceData.supplier} onChange={(e) => setInvoiceData({ ...invoiceData, supplier: e.target.value })} placeholder="اسم المورد" required /></div>
                    <div><Label htmlFor="date">تاريخ الفاتورة *</Label><Input id="date" type="date" value={invoiceData.date} onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })} required /></div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4"><Label className="text-lg font-semibold">بنود الفاتورة</Label><Button type="button" variant="outline" onClick={addInvoiceItem}><Plus className="w-4 h-4 mr-2" />إضافة بند</Button></div>
                    <div className="space-y-4">{invoiceItems.map((item, index) => <Card key={index} className="p-4 bg-blue-50 border-blue-200"><div className="grid grid-cols-1 md:grid-cols-8 gap-4"><div><Label>المؤشر</Label><Input value={item.index || ''} onChange={(e) => updateInvoiceItem(index, 'index', e.target.value)} placeholder="مثال: A-12" /></div><div><Label>اسم المنتج</Label><Input value={item.productName} onChange={(e) => updateInvoiceItem(index, 'productName', e.target.value)} placeholder="اسم المنتج" /></div><div><Label>الباركود</Label><Input value={item.barcode} onChange={(e) => updateInvoiceItem(index, 'barcode', e.target.value)} placeholder="1234567890123" /></div><div><Label>الفئة</Label><Select value={item.category} onValueChange={(value) => updateInvoiceItem(index, 'category', value)}><SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}</SelectContent></Select></div><div><Label>الكمية</Label><Input type="number" value={item.quantity} onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="0" /></div><div><Label>سعر الشراء</Label><Input type="number" step="0.01" value={item.purchasePrice} onChange={(e) => updateInvoiceItem(index, 'purchasePrice', parseFloat(e.target.value) || 0)} placeholder="0.00" /></div><div><Label>سعر البيع</Label><Input type="number" step="0.01" value={item.salePrice} onChange={(e) => updateInvoiceItem(index, 'salePrice', parseFloat(e.target.value) || 0)} placeholder="0.00" /></div><div className="flex items-end"><Button type="button" variant="destructive" size="sm" onClick={() => removeInvoiceItem(index)} disabled={invoiceItems.length === 1}>حذف</Button></div></div></Card>)}</div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg"><div className="flex justify-between items-center text-lg font-bold"><span>إجمالي الفاتورة:</span><span className="text-blue-600">{calculateTotal().toFixed(2)} د.ل</span></div></div>
                  <div className="flex gap-2"><Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">حفظ الفاتورة</Button><Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-white/60 backdrop-blur-sm border-blue-100"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Receipt className="w-5 h-5" />قائمة فواتير الشراء ({invoices.length})</CardTitle></CardHeader><CardContent>{invoices.length === 0 ? <div className="text-center py-8 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>لا توجد فواتير شراء حتى الآن</p><p className="text-sm mt-2">قم بإضافة فاتورة شراء جديدة لتظهر هنا</p></div> : <div className="space-y-4">{invoices.map((invoice) => <Card key={invoice.id} className="border-blue-200 hover:shadow-md transition-all duration-200"><CardContent className="p-4"><div className="flex justify-between items-start gap-4"><div className="space-y-2 flex-1 cursor-pointer" onClick={() => { setSelectedInvoice(invoice); setIsInvoiceDialogOpen(true); }}><div className="flex items-center gap-2"><Badge variant="outline" className="text-blue-600 border-blue-300">{invoice.invoiceNumber}</Badge><span className="text-sm text-gray-600">{invoice.items.length} منتج</span></div><div className="flex items-center gap-4 text-sm text-gray-600"><div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{invoice.date} - {invoice.time}</div><div className="flex items-center gap-1"><Building className="w-4 h-4" />{invoice.supplier}</div></div></div><div className="text-left"><div className="text-lg font-bold text-blue-600">{invoice.total.toFixed(2)} د.ل</div><div className="flex gap-2 mt-2"><Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(invoice); setIsInvoiceDialogOpen(true); }}>عرض التفاصيل</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteInvoice(invoice)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button></div></div></div></CardContent></Card>)}</div>}</CardContent></Card>

      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />تفاصيل فاتورة الشراء {selectedInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          {selectedInvoice && <div className="space-y-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg"><div><span className="text-sm text-gray-600">رقم الفاتورة</span><p className="font-semibold">{selectedInvoice.invoiceNumber}</p></div><div><span className="text-sm text-gray-600">التاريخ</span><p className="font-semibold">{selectedInvoice.date}</p></div><div><span className="text-sm text-gray-600">الوقت</span><p className="font-semibold">{selectedInvoice.time}</p></div><div><span className="text-sm text-gray-600">المورد</span><p className="font-semibold">{selectedInvoice.supplier}</p></div></div><div><h3 className="text-lg font-semibold mb-4">تفاصيل المنتجات</h3><Table><TableHeader><TableRow><TableHead className="text-right">المؤشر</TableHead><TableHead className="text-right">المنتج</TableHead><TableHead className="text-right">الباركود</TableHead><TableHead className="text-right">الفئة</TableHead><TableHead className="text-right">سعر الشراء</TableHead><TableHead className="text-right">سعر البيع</TableHead><TableHead className="text-right">الكمية</TableHead><TableHead className="text-right">الإجمالي</TableHead></TableRow></TableHeader><TableBody>{selectedInvoice.items.map((item, index) => <TableRow key={index}><TableCell>{item.index || '-'}</TableCell><TableCell className="font-medium">{item.productName}</TableCell><TableCell className="text-sm text-gray-600">{item.barcode}</TableCell><TableCell>{item.category && <Badge className="text-white text-xs" style={{ backgroundColor: getCategoryColor(item.category) }}>{item.category}</Badge>}</TableCell><TableCell>{item.purchasePrice.toFixed(2)} د.ل</TableCell><TableCell className="text-green-600 font-medium">{item.salePrice.toFixed(2)} د.ل</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="font-semibold">{(item.purchasePrice * item.quantity).toFixed(2)} د.ل</TableCell></TableRow>)}</TableBody></Table></div><div className="border-t pt-4"><div className="flex justify-between items-center text-xl font-bold"><span>المبلغ الإجمالي:</span><span className="text-blue-600">{selectedInvoice.total.toFixed(2)} د.ل</span></div></div><div className="flex gap-2 pt-4"><Button variant="destructive" onClick={() => handleDeleteInvoice(selectedInvoice)}><Trash2 className="w-4 h-4 mr-2" />حذف الفاتورة</Button><Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)} className="flex-1">إغلاق</Button></div></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseInvoices;