import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2,
  User,
  Shield,
  Calendar,
  Trash2,
  Edit2
} from 'lucide-react';

export default function WorkerFollowupPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingWorker, setEditingWorker] = useState<any>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workers', {
        headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
      });
      const data = await res.json();
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshCounter]);

  const handleComplete = async (id: number) => {
    try {
      const res = await fetch(`/api/workers/${id}/complete-followup`, {
        method: 'POST',
        headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error completing followup:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العامل؟')) return;
    try {
      const res = await fetch(`/api/workers/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting worker:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/workers/${editingWorker.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({
          name: editingWorker.name,
          job: editingWorker.job,
          sponsor: editingWorker.sponsor,
          nid: editingWorker.nid
        })
      });
      if (res.ok) {
        setEditingWorker(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating worker:', error);
    }
  };

  const calculateDays = (dateStr: string) => {
    if (!dateStr) return 0;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 0;
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return 0;
    }
  };

  const getStatus = (lastFollowupDate: string) => {
    const days = calculateDays(lastFollowupDate);
    if (days >= 30) return 'needs_followup';
    return 'normal';
  };

  const filteredWorkers = workers.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.nid || '').includes(searchTerm);
    
    const status = getStatus(w.last_followup_date);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">متابعة العمال الشهرية</h2>
          <p className="text-slate-500 dark:text-slate-400">متابعة دورية للعمال كل 30 يوم لضمان سير العمل</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="بحث بالاسم أو الهوية..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pr-12 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="pr-12 pl-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">جميع الحالات</option>
              <option value="normal">طبيعي</option>
              <option value="needs_followup">يحتاج متابعة</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr>
                <th>رقم العامل</th>
                <th>اسم العامل</th>
                <th>رقم الهوية / الإقامة</th>
                <th>اسم الكفيل</th>
                <th>تاريخ التسجيل</th>
                <th>الأيام منذ المتابعة</th>
                <th>الحالة</th>
                <th className="text-center">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-500" size={32} />
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-slate-400">
                    لا يوجد عمال مطابقين للبحث
                  </td>
                </tr>
              ) : filteredWorkers.map((worker) => {
                const daysSinceFollowup = calculateDays(worker.last_followup_date);
                const isLate = daysSinceFollowup >= 30;

                return (
                  <tr key={worker.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isLate ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`}>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400">#{worker.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <User size={16} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{worker.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{worker.nid || '---'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Shield size={14} />
                        <span>{worker.sponsor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                        <Calendar size={14} />
                        <span>{worker.registration_date || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 text-sm font-bold ${isLate ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        <Clock size={14} />
                        <span>{daysSinceFollowup} يوم</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isLate ? (
                        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold bg-rose-100 dark:bg-rose-900/20 px-2 py-1 rounded-lg w-fit">
                          <AlertCircle size={14} /> يحتاج متابعة
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/20 px-2 py-1 rounded-lg w-fit">
                          <CheckCircle2 size={14} /> طبيعي
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleComplete(worker.id)}
                          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isLate 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          }`}
                          disabled={!isLate}
                          title="تحديد كمنجز"
                        >
                          <CheckCircle2 size={14} />
                          <span>منجز</span>
                        </button>

                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => setEditingWorker(worker)}
                              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                              title="تعديل"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(worker.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingWorker && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">تعديل بيانات العامل</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم العامل</label>
                <input 
                  type="text"
                  required
                  value={editingWorker.name}
                  onChange={e => setEditingWorker({...editingWorker, name: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">المهنة</label>
                <input 
                  type="text"
                  required
                  value={editingWorker.job}
                  onChange={e => setEditingWorker({...editingWorker, job: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">الكفيل</label>
                <input 
                  type="text"
                  required
                  value={editingWorker.sponsor}
                  onChange={e => setEditingWorker({...editingWorker, sponsor: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">رقم الهوية / الإقامة</label>
                <input 
                  type="text"
                  required
                  value={editingWorker.nid}
                  onChange={e => setEditingWorker({...editingWorker, nid: e.target.value})}
                  className="input-field"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  حفظ التغييرات
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="flex-1 btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
