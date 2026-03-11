import { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  User, 
  Clock, 
  Globe, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

export default function ActivityLogs({ currentUser }: { currentUser: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/logs', {
          headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
        });
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.user_name?.toLowerCase() || 'نظام').includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
    
    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN_SUCCESS')) return <CheckCircle2 className="text-emerald-500" size={18} />;
    if (action.includes('LOGIN_FAILED')) return <AlertCircle className="text-rose-500" size={18} />;
    if (action.includes('DELETE')) return <XCircle className="text-rose-500" size={18} />;
    return <FileText className="text-blue-500" size={18} />;
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS': return 'تسجيل دخول ناجح';
      case 'LOGIN_FAILED': return 'فشل تسجيل الدخول';
      case 'USER_UPDATE': return 'تعديل مستخدم';
      case 'USER_DELETE': return 'حذف مستخدم';
      case 'SETTINGS_UPDATE': return 'تحديث الإعدادات';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">سجل النشاطات</h2>
          <p className="text-slate-500">مراقبة جميع العمليات والتحركات داخل النظام</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="بحث في السجلات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="pr-12 pl-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none font-bold text-slate-700"
            >
              <option value="all">جميع العمليات</option>
              <option value="LOGIN">تسجيل الدخول</option>
              <option value="USER">إدارة المستخدمين</option>
              <option value="SETTINGS">الإعدادات</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">العملية</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المستخدم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التفاصيل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">IP</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-500" size={32} />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    لا توجد سجلات مطابقة
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {getActionIcon(log.action)}
                      <span className="text-sm">{getActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User size={14} />
                      <span>{log.user_name || 'نظام'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Globe size={12} />
                      <span>{log.ip_address || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} />
                      <span>{new Date(log.created_at).toLocaleString('ar-SA')}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
