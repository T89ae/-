import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, FileText, AlertCircle, Loader2, History as HistoryIcon, CheckSquare } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function Dashboard({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats', {
        headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
      });
      if (!res.ok) throw new Error('فشل في جلب البيانات');
      const data = await res.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshCounter]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">عذراً، حدث خطأ أثناء تحميل البيانات</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'لا توجد بيانات متاحة حالياً'}</p>
        <button 
          onClick={fetchStats}
          className="btn-primary px-8"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const pieData = [
    { name: 'المبيعات', value: stats.totalSales || 0 },
    { name: 'المصروفات', value: stats.totalExpenses || 0 },
  ];

  return (
    <div className="space-y-6">
      {(stats.upcomingDebts > 0 || stats.unreadMessages > 0 || stats.workersNeedingFollowup > 0) && (
        <div className="flex flex-col gap-3">
          {stats.workersNeedingFollowup > 0 && (
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-4 rounded-2xl flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <div className="text-sm font-bold">🔔 تنبيه: يوجد {stats.workersNeedingFollowup} عمال تجاوزوا شهر من تاريخ تسجيلهم ويحتاجون متابعة.</div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'worker_followup' }))}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
              >
                انتقال للمتابعة
              </button>
            </div>
          )}
          {stats.upcomingDebts > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-300">
              <AlertCircle size={20} />
              <div className="text-sm font-bold">تنبيه: يوجد {stats.upcomingDebts} ديون مستحقة خلال الـ 3 أيام القادمة.</div>
            </div>
          )}
          {stats.unreadMessages > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
              <FileText size={20} />
              <div className="text-sm font-bold">لديك {stats.unreadMessages} رسائل جديدة غير مقروءة.</div>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="العملاء النشطون" value={(stats.clientsCount || 0).toString()} icon={<Users className="text-[#00BFFF]" />} trend="نشط" />
        <StatCard title="مهام قيد الانتظار" value={(stats.pendingTasksCount || 0).toString()} icon={<CheckSquare className="text-amber-500" />} trend="هام" />
        <StatCard title="إجمالي الإيرادات" value={`${(stats.totalSales || 0).toLocaleString()} ر.س`} icon={<TrendingUp className="text-emerald-500" />} trend="+12%" />
        <StatCard title="الديون المستحقة" value={`${(stats.outstandingDebts || 0).toLocaleString()} ر.س`} icon={<AlertCircle className="text-rose-500" />} trend="متابعة" />
        
        {isSuperAdmin && (
          <>
            <StatCard title="إجمالي المستخدمين" value={(stats.usersCount || 0).toString()} icon={<Users className="text-indigo-500" />} trend="نشط" />
            <StatCard title="سجلات النظام" value={(stats.logsCount || 0).toString()} icon={<HistoryIcon className="text-slate-500" />} trend="مراقب" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-white/5">
          <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">تحليل المبيعات والمصروفات</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-[#333]" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#0f172a',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#00BFFF" strokeWidth={4} dot={{ r: 4, fill: '#00BFFF', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" name="المصروفات" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-white/5">
          <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">توزيع الميزانية</h3>
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
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00BFFF' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: '#0f172a',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{((stats.totalSales || 0) + (stats.totalExpenses || 0)).toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">إجمالي التدفق</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00BFFF]"></div>
              <span className="text-xs font-bold text-slate-400">المبيعات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-bold text-slate-400">المصروفات</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-white/5 hover:border-[#00BFFF]/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl group-hover:bg-[#00BFFF]/10 transition-colors">{icon}</div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-[#00BFFF]/10 text-[#00BFFF]' : 'bg-rose-500/10 text-rose-500'}`}>
          {trend}
        </span>
      </div>
      <h4 className="text-sm font-bold text-slate-500 mb-1">{title}</h4>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
