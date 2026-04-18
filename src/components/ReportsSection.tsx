import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, FileText, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import type { ReportsSummary } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

const emptySummary: ReportsSummary = {
  salesReportData: [],
  purchaseReportData: [],
  profitReportData: [],
  topSellingProducts: [],
  purchasedItems: [],
  soldItems: [],
};

const ReportsSection = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reports, setReports] = useState<ReportsSummary>(emptySummary);
  const { toast } = useToast();

  const generateReport = async () => {
    try {
      const data = await api.getReports(dateFrom, dateTo);
      setReports(data);
    } catch (error) {
      toast({ title: 'تعذر إنشاء التقرير', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    }
  };

  useEffect(() => { generateReport(); }, []);

  const noData = useMemo(() => {
    switch (selectedReport) {
      case 'sales': return reports.salesReportData.length === 0;
      case 'purchases': return reports.purchaseReportData.length === 0;
      case 'profits': return reports.profitReportData.length === 0;
      case 'top-selling': return reports.topSellingProducts.length === 0;
      case 'purchased-items': return reports.purchasedItems.length === 0;
      case 'sold-items': return reports.soldItems.length === 0;
      default: return true;
    }
  }, [reports, selectedReport]);

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'sales':
        return (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><TrendingUp className="w-5 h-5" />تقرير المبيعات</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead className="text-right">التاريخ</TableHead><TableHead className="text-right">عدد الفواتير</TableHead><TableHead className="text-right">عدد الأصناف</TableHead><TableHead className="text-right">إجمالي المبيعات</TableHead></TableRow></TableHeader>
                  <TableBody>{reports.salesReportData.map((item, index) => <TableRow key={index}><TableCell>{item.date}</TableCell><TableCell>{item.invoices}</TableCell><TableCell>{item.items}</TableCell><TableCell className="font-semibold text-blue-600">{item.total.toFixed(2)} د.ل</TableCell></TableRow>)}</TableBody>
                </Table>
                <div className="h-72 mt-6">
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={reports.salesReportData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => [`${value} د.ل`, 'المبيعات']} /><Bar dataKey="total" fill="#3B82F6" /></BarChart></ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'purchases':
        return <Card className="bg-white/80 backdrop-blur-sm border-blue-100"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><ShoppingCart className="w-5 h-5" />تقرير المشتريات</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="text-right">التاريخ</TableHead><TableHead className="text-right">عدد الفواتير</TableHead><TableHead className="text-right">عدد الأصناف</TableHead><TableHead className="text-right">إجمالي المشتريات</TableHead></TableRow></TableHeader><TableBody>{reports.purchaseReportData.map((item, index) => <TableRow key={index}><TableCell>{item.date}</TableCell><TableCell>{item.invoices}</TableCell><TableCell>{item.items}</TableCell><TableCell className="font-semibold text-green-600">{item.total.toFixed(2)} د.ل</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
      case 'profits':
        return <Card className="bg-white/80 backdrop-blur-sm border-blue-100"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><DollarSign className="w-5 h-5" />تقرير الأرباح</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="text-right">التاريخ</TableHead><TableHead className="text-right">المبيعات</TableHead><TableHead className="text-right">المشتريات</TableHead><TableHead className="text-right">صافي الربح</TableHead></TableRow></TableHeader><TableBody>{reports.profitReportData.map((item, index) => <TableRow key={index}><TableCell>{item.date}</TableCell><TableCell className="text-blue-600">{item.sales.toFixed(2)} د.ل</TableCell><TableCell className="text-red-600">{item.purchases.toFixed(2)} د.ل</TableCell><TableCell className="font-semibold text-green-600">{item.profit.toFixed(2)} د.ل</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
      case 'top-selling':
        return <Card className="bg-white/80 backdrop-blur-sm border-blue-100"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><TrendingUp className="w-5 h-5" />المنتجات الأكثر مبيعاً</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="text-right">الكمية المباعة</TableHead><TableHead className="text-right">إجمالي الإيرادات</TableHead></TableRow></TableHeader><TableBody>{reports.topSellingProducts.map((item, index) => <TableRow key={index}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="font-semibold text-blue-600">{item.revenue.toFixed(2)} د.ل</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
      case 'purchased-items':
        return <Card className="bg-white/80 backdrop-blur-sm border-blue-100"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Package className="w-5 h-5" />المنتجات التي تم شراؤها</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="text-right">الكمية المشتراة</TableHead><TableHead className="text-right">إجمالي التكلفة</TableHead></TableRow></TableHeader><TableBody>{reports.purchasedItems.map((item, index) => <TableRow key={index}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="font-semibold text-green-600">{item.cost.toFixed(2)} د.ل</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
      case 'sold-items':
        return <Card className="bg-white/80 backdrop-blur-sm border-blue-100"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><Package className="w-5 h-5" />المنتجات التي تم بيعها</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="text-right">الكمية المباعة</TableHead><TableHead className="text-right">الكمية المتبقية</TableHead></TableRow></TableHeader><TableBody>{reports.soldItems.map((item, index) => <TableRow key={index}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-blue-600">{item.quantity}</TableCell><TableCell className="font-semibold text-orange-600">{item.remaining}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><h2 className="text-2xl font-bold text-blue-800">التقارير والإحصائيات</h2></div>

      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader><CardTitle className="flex items-center gap-2 text-blue-800"><FileText className="w-6 h-6" />إعدادات التقرير</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2"><Label>نوع التقرير</Label><Select value={selectedReport} onValueChange={setSelectedReport}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sales">تقرير المبيعات</SelectItem><SelectItem value="purchases">تقرير المشتريات</SelectItem><SelectItem value="profits">تقرير الأرباح</SelectItem><SelectItem value="top-selling">المنتجات الأكثر مبيعاً</SelectItem><SelectItem value="purchased-items">المنتجات المشتراة</SelectItem><SelectItem value="sold-items">المنتجات المباعة</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>من تاريخ</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
            <div className="space-y-2"><Label>إلى تاريخ</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
            <div className="space-y-2"><Label className="invisible">إجراءات</Label><Button onClick={generateReport} className="w-full bg-gradient-to-r from-blue-500 to-purple-500"><Calendar className="w-4 h-4 mr-2" />إنشاء التقرير</Button></div>
          </div>
        </CardContent>
      </Card>

      {noData ? <Card className="bg-white/80 backdrop-blur-sm border-blue-100"><CardContent className="py-12 text-center text-gray-500">لا توجد بيانات لهذا التقرير حالياً</CardContent></Card> : renderReportContent()}
    </div>
  );
};

export default ReportsSection;
