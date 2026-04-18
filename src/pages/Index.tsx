import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, FileText, BarChart3, Calculator, Receipt, LogOut, ShieldCheck, UserCircle2 } from 'lucide-react';
import SalesInterface from '@/components/SalesInterface';
import ProductManagement from '@/components/ProductManagement';
import PurchaseInvoices from '@/components/PurchaseInvoices';
import ReportsSection from '@/components/ReportsSection';
import SalesInvoices from '@/components/SalesInvoices';
import LoginPage from '@/components/auth/LoginPage';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center" dir="rtl">جارٍ التحميل...</div>;
  }

  if (!user) return <LoginPage />;

  const isAdmin = user.role === 'admin';
  const tabs = [
    ...(isAdmin ? [{ value: 'reports', label: 'التقارير', icon: BarChart3 }] : []),
    ...(isAdmin ? [{ value: 'invoices', label: 'فواتير الشراء', icon: FileText }] : []),
    { value: 'sales-invoices', label: 'فواتير المبيعات', icon: Receipt },
    { value: 'products', label: 'المنتجات', icon: Package },
    { value: 'sales', label: 'نقطة البيع', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cafe-cream via-cafe-beige to-cafe-sand" dir="rtl">
      <div className="bg-white/80 backdrop-blur-sm border-b border-cafe-beige sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-cafe-brown to-[#7A3420] rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cafe-brown to-[#7A3420] bg-clip-text text-transparent">نظام نقطة البيع</h1>
                <p className="text-sm text-gray-600">نسخة بصلاحيات دخول وجلسات بيع وإلغاء مبيعات</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">متصل</Badge>
              <Badge variant="outline" className="text-cafe-brown border-cafe-sand flex items-center gap-1"><UserCircle2 className="w-4 h-4" />{user.displayName}</Badge>
              <Badge variant="outline" className="text-purple-600 border-purple-200 flex items-center gap-1"><ShieldCheck className="w-4 h-4" />{isAdmin ? 'مدير' : 'موظف كافيه'}</Badge>
              <Button variant="outline" onClick={logout}><LogOut className="w-4 h-4 ml-2" />تسجيل الخروج</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full bg-white/60 backdrop-blur-sm border border-cafe-beige h-16`} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} dir="rtl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cafe-brown data-[state=active]:to-[#7A3420] data-[state=active]:text-white">
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="sales" className="m-0"><SalesInterface /></TabsContent>
          <TabsContent value="products" className="m-0"><ProductManagement /></TabsContent>
          <TabsContent value="sales-invoices" className="m-0"><SalesInvoices /></TabsContent>
          {isAdmin && <TabsContent value="invoices" className="m-0"><PurchaseInvoices /></TabsContent>}
          {isAdmin && <TabsContent value="reports" className="m-0"><ReportsSection /></TabsContent>}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;