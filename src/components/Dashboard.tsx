import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, FileText, AlertCircle, Loader2, History as HistoryIcon } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function Dashboard({ currentUser }: { currentUser: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats', {
          headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
        });
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const pieData = [
    { name: 'المبيعات', value: stats.totalSales },
    { name: 'المصروفات', value: stats.totalExpenses },
  ];

  return (
    <div className="space-y-6">
      {(stats.upcomingDebts > 0 || stats.unreadMessages > 0) && (
        <div className="flex flex-col gap-3">
          {stats.upcomingDebts > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
              <AlertCircle size={20} />
              <div className="text-sm font-bold">تنبيه: يوجد {stats.upcomingDebts} ديون مستحقة خلال الـ 3 أيام القادمة.</div>
            </div>
          )}
          {stats.unreadMessages > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-800">
              <FileText size={20} />
              <div className="text-sm font-bold">لديك {stats.unreadMessages} رسائل جديدة غير مقروءة.</div>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المبيعات" value={`${stats.totalSales.toLocaleString()} ر.س`} icon={<TrendingUp className="text-emerald-500" />} trend="+12%" />
        <StatCard title="إجمالي المصروفات" value={`${stats.totalExpenses.toLocaleString()} ر.س`} icon={<AlertCircle className="text-rose-500" />} trend="+5%" />
        <StatCard title="عدد العمال" value={stats.workersCount.toString()} icon={<Users className="text-blue-500" />} trend="+2" />
        <StatCard title="عدد العمليات" value={stats.salesCount.toString()} icon={<FileText className="text-amber-500" />} trend="+8" />
        
        {isSuperAdmin && (
          <>
            <StatCard title="إجمالي المستخدمين" value={stats.usersCount.toString()} icon={<Users className="text-indigo-500" />} trend="نشط" />
            <StatCard title="سجلات النظام" value={stats.logsCount.toString()} icon={<HistoryIcon className="text-slate-500" />} trend="مراقب" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">تحليل المبيعات والمصروفات</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" name="المصروفات" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">توزيع الميزانية</h3>
          <div className="h-80 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{(stats.totalSales + stats.totalExpenses).toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">إجمالي التدفق</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold text-slate-600">المبيعات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-bold text-slate-600">المصروفات</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend}
        </span>
      </div>
      <h4 className="text-sm font-bold text-slate-500 mb-1">{title}</h4>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
