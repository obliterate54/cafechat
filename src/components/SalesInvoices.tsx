import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, FileText, Calendar, User, Printer, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { SaleInvoice } from '@/types/pos';
import { printSaleReceipt } from '@/lib/receipt';

const SalesInvoices = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [salesInvoices, setSalesInvoices] = useState<SaleInvoice[]>([]);
  const { toast } = useToast();

  const loadSales = async () => {
    try {
      setSalesInvoices(await api.getSales());
    } catch (error) {
      toast({ title: 'تعذر تحميل فواتير المبيعات', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  useEffect(() => { loadSales(); }, []);

  const handleDelete = async (invoice: SaleInvoice) => {
    if (!window.confirm(`هل تريد إلغاء وحذف الفاتورة ${invoice.invoiceNumber}؟ سيتم إرجاع الأصناف إلى المخزون.`)) return;
    try {
      await api.deleteSale(invoice.id);
      if (selectedInvoice?.id === invoice.id) setIsInvoiceDialogOpen(false);
      await loadSales();
      toast({ title: 'تم إلغاء البيع', description: 'تم حذف الفاتورة وإرجاع الكميات إلى المخزون' });
    } catch (error) {
      toast({ title: 'تعذر حذف الفاتورة', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800"><FileText className="w-6 h-6" />فواتير المبيعات</CardTitle>
          <p className="text-sm text-gray-600">إجمالي الفواتير: {salesInvoices.length} فاتورة</p>
        </CardHeader>
      </Card>

      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Receipt className="w-5 h-5" />قائمة الفواتير ({salesInvoices.length})</CardTitle></CardHeader>
        <CardContent>
          {salesInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>لا توجد فواتير مبيعات حتى الآن</p><p className="text-sm mt-2">ستظهر الفواتير هنا بعد إتمام عمليات البيع</p></div>
          ) : (
            <div className="space-y-4">
              {salesInvoices.map((invoice) => (
                <Card key={invoice.id} className="border-blue-200 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 cursor-pointer flex-1" onClick={() => { setSelectedInvoice(invoice); setIsInvoiceDialogOpen(true); }}>
                        <div className="flex items-center gap-2"><Badge variant="outline" className="text-blue-600 border-blue-300">{invoice.invoiceNumber}</Badge><span className="text-sm text-gray-600">{invoice.items.length} منتج</span></div>
                        <div className="flex items-center gap-4 text-sm text-gray-600"><div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{invoice.date} - {invoice.time}</div><div className="flex items-center gap-1"><User className="w-4 h-4" />{invoice.cashier}</div></div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-blue-600">{invoice.total.toFixed(2)} د.ل</div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(invoice); setIsInvoiceDialogOpen(true); }}>عرض التفاصيل</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(invoice)}><Trash2 className="w-4 h-4 ml-1" />حذف</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" />تفاصيل الفاتورة {selectedInvoice?.invoiceNumber}</DialogTitle></DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div><span className="text-sm text-gray-600">رقم الفاتورة</span><p className="font-semibold">{selectedInvoice.invoiceNumber}</p></div>
                <div><span className="text-sm text-gray-600">التاريخ</span><p className="font-semibold">{selectedInvoice.date}</p></div>
                <div><span className="text-sm text-gray-600">الوقت</span><p className="font-semibold">{selectedInvoice.time}</p></div>
                <div><span className="text-sm text-gray-600">البائع</span><p className="font-semibold">{selectedInvoice.cashier}</p></div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">تفاصيل المنتجات</h3>
                <Table><TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="text-right">السعر</TableHead><TableHead className="text-right">الكمية</TableHead><TableHead className="text-right">الإجمالي</TableHead></TableRow></TableHeader><TableBody>{selectedInvoice.items.map((item, index) => <TableRow key={index}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.price.toFixed(2)} د.ل</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="font-semibold">{(item.price * item.quantity).toFixed(2)} د.ل</TableCell></TableRow>)}</TableBody></Table>
              </div>

              <div className="border-t pt-4"><div className="flex justify-between items-center text-xl font-bold"><span>المبلغ الإجمالي:</span><span className="text-blue-600">{selectedInvoice.total.toFixed(2)} د.ل</span></div></div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500" onClick={() => printSaleReceipt(selectedInvoice)}><Printer className="w-4 h-4 mr-2" />طباعة الفاتورة</Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedInvoice)}><Trash2 className="w-4 h-4 mr-2" />حذف الفاتورة</Button>
                <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>إغلاق</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesInvoices;