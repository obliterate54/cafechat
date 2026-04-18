import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
      toast({ title: 'تم تسجيل الدخول', description: 'مرحبًا بك في نظام نقطة البيع' });
    } catch (error) {
      toast({ title: 'فشل تسجيل الدخول', description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4" dir="rtl">
      <Card className="w-full max-w-md border-blue-100 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-800">تسجيل الدخول</CardTitle>
          <p className="text-center text-sm text-gray-500">الدخول حسب مستوى الصلاحية: مدير أو موظف كافيه</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin أو cafe" />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              {isSubmitting ? 'جارٍ الدخول...' : 'دخول'}
            </Button>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3 leading-6">
              حسابات التجربة بعد أول تشغيل: admin / admin123 و cafe / cafe123
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;