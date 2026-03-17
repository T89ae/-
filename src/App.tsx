import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  CreditCard,
  History,
  Trash2,
  UserPlus,
  Plus,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Edit2,
  Save,
  Moon,
  Sun,
  CheckSquare,
  RefreshCcw,
  BarChart3,
  Wallet,
  CalendarCheck,
  MessageSquare,
  Settings,
  Lock,
  Target,
  History as HistoryIcon,
  ExternalLink
} from 'lucide-react';
import { SECTIONS } from './constants';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import UserManual from './components/UserManual';
import MessagingPage from './components/MessagingPage';
import AccountingPage from './components/AccountingPage';
import UserManagement from './components/UserManagement';
import SystemSettings from './components/SystemSettings';
import ActivityLogs from './components/ActivityLogs';
import ConfirmModal from './components/ConfirmModal';
import WorkerFollowupPage from './components/WorkerFollowupPage';
import LandingPage from './components/LandingPage';
import TasksPage from './components/TasksPage';
import BrokersDuesPage from './components/BrokersDuesPage';
import SalesDebtsPage from './components/SalesDebtsPage';
import FileManagementPage from './components/FileManagementPage';
import ClientsPage from './components/ClientsPage';
import AgentsPage from './components/AgentsPage';
import AIAdvisor from './components/AIAdvisor';
import AIChatbot from './components/AIChatbot';

// --- Components for the new sections ---

function WorkersPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [job, setJob] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [nid, setNid] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
  // Filtering and Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchWorkers = async () => {
    const res = await fetch('/api/workers', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setWorkers(data);
    setLoading(false);
  };

  useEffect(() => { fetchWorkers(); }, [refreshCounter]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredWorkers = workers
    .filter(w => 
      (w.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (w.job?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (w.sponsor?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const aValue = a[sortField].toString().toLowerCase();
      const bValue = b[sortField].toString().toLowerCase();
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWorkers.slice(indexOfFirstItem, indexOfLastItem);

  const addWorker = async () => {
    if (!name || !job || !sponsor) return;
    if (editingId) {
      await fetch(`/api/workers/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ name, job, sponsor, nid })
      });
      setEditingId(null);
    } else {
      await fetch('/api/workers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ name, job, sponsor, nid })
      });
    }
    setName(''); setJob(''); setSponsor(''); setNid('');
    fetchWorkers();
  };

  const deleteWorker = async (id: number) => {
    setWorkerToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (workerToDelete === null) return;
    await fetch(`/api/workers/${workerToDelete}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    setIsConfirmOpen(false);
    setWorkerToDelete(null);
    fetchWorkers();
  };

  const startEdit = (w: any) => {
    setEditingId(w.id);
    setName(w.name);
    setJob(w.job);
    setSponsor(w.sponsor);
    setNid(w.nid || '');
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp size={14} className="text-emerald-500" /> : <ArrowDown size={14} className="text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'تعديل بيانات عامل' : 'إضافة عامل جديد'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم العامل" className="input-field" />
          <input value={job} onChange={e => setJob(e.target.value)} placeholder="المهنة" className="input-field" />
          <input value={sponsor} onChange={e => setSponsor(e.target.value)} placeholder="الكفيل" className="input-field" />
          <input value={nid} onChange={e => setNid(e.target.value)} placeholder="رقم الهوية / الإقامة" className="input-field" />
          <button onClick={addWorker} className="md:col-span-2 lg:col-span-4 btn-primary flex items-center justify-center gap-2">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'إضافة عامل'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setName(''); setJob(''); setSponsor(''); setNid(''); }} className="md:col-span-2 lg:col-span-4 btn-secondary">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <ConfirmModal 
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="حذف عامل"
          message="هل أنت متأكد من حذف هذا العامل؟ لا يمكن التراجع عن هذا الإجراء."
        />
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="بحث في قائمة العمال..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Filter size={14} />
            <span>إجمالي النتائج: {filteredWorkers.length}</span>
          </div>
        </div>
        <div className="table-container border-none shadow-none rounded-none">
          <table className="w-full text-right">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    الاسم <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('job')}
                >
                  <div className="flex items-center gap-2">
                    المهنة <SortIcon field="job" />
                  </div>
                </th>
                <th 
                  className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('sponsor')}
                >
                  <div className="flex items-center gap-2">
                    الكفيل <SortIcon field="sponsor" />
                  </div>
                </th>
                <th>رقم الهوية</th>
                {isAdmin && <th className="text-center">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400">لا يوجد نتائج تطابق بحثك</td></tr>
              ) : currentItems.map((w: any) => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{w.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{w.job}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{w.sponsor}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-500 font-mono">{w.nid || '---'}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(w)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteWorker(w.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              عرض {indexOfFirstItem + 1} إلى {Math.min(indexOfLastItem, filteredWorkers.length)} من أصل {filteredWorkers.length}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      currentPage === page 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SponsorsPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [nid, setNid] = useState('');
  const [phone, setPhone] = useState('');
  const [broker, setBroker] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<any>(null);
  const [sponsorWorkers, setSponsorWorkers] = useState<any[]>([]);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const fetchSponsors = async () => {
    const res = await fetch('/api/sponsors', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setSponsors(data);
    setLoading(false);
  };

  const fetchSponsorWorkers = async (id: number) => {
    const res = await fetch(`/api/sponsors/${id}/workers`, {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setSponsorWorkers(data);
  };

  useEffect(() => { fetchSponsors(); }, [refreshCounter]);

  const addSponsor = async () => {
    if (!name || !nid || !phone || !broker) return;
    if (editingId) {
      await fetch(`/api/sponsors/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ sponsor_name: name, national_id: nid, phone, broker_name: broker })
      });
      setEditingId(null);
    } else {
      await fetch('/api/sponsors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ name, nid, phone, broker })
      });
    }
    setName(''); setNid(''); setPhone(''); setBroker('');
    fetchSponsors();
  };

  const deleteSponsor = async (id: number) => {
    setSponsorToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (sponsorToDelete === null) return;
    await fetch(`/api/sponsors/${sponsorToDelete}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    setIsConfirmOpen(false);
    setSponsorToDelete(null);
    fetchSponsors();
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setName(s.sponsor_name);
    setNid(s.national_id);
    setPhone(s.phone);
    setBroker(s.broker_name);
  };

  const addSponsoredWorker = async () => {
    if (!newWorkerName || !selectedSponsor) return;
    await fetch('/api/sponsored-workers', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentUser?.id?.toString() || ''
      },
      body: JSON.stringify({ name: newWorkerName, sponsor_id: selectedSponsor.id })
    });
    setNewWorkerName('');
    fetchSponsorWorkers(selectedSponsor.id);
    fetchSponsors(); // Update counts
  };

  const deleteSponsoredWorker = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العامل؟')) return;
    await fetch(`/api/sponsored-workers/${id}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    fetchSponsorWorkers(selectedSponsor.id);
    fetchSponsors();
  };

  if (selectedSponsor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setSelectedSponsor(null)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ChevronLeft className="rotate-180" size={24} />
          </button>
          <h2 className="text-2xl font-bold dark:text-white">عمال الكفيل: {selectedSponsor.sponsor_name}</h2>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold mb-4 dark:text-white">إضافة عامل لهذا الكفيل</h3>
          <div className="flex gap-4">
            <input 
              value={newWorkerName} 
              onChange={e => setNewWorkerName(e.target.value)} 
              placeholder="اسم العامل" 
              className="input-field" 
            />
            <button 
              onClick={addSponsoredWorker} 
              className="btn-primary"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="w-full text-right">
            <thead>
              <tr>
                <th>اسم العامل</th>
                {isAdmin && <th className="text-center">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {sponsorWorkers.length === 0 ? (
                <tr><td colSpan={isAdmin ? 2 : 1} className="px-6 py-12 text-center text-slate-400">لا يوجد عمال لهذا الكفيل</td></tr>
              ) : sponsorWorkers.map((w: any) => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{w.worker_name}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-sm text-center">
                      <button onClick={() => deleteSponsoredWorker(w.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'تعديل بيانات كفيل' : 'إضافة كفيل جديد'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الكفيل" className="input-field" />
          <input value={nid} onChange={e => setNid(e.target.value)} placeholder="رقم الهوية" className="input-field" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الجوال" className="input-field" />
          <input value={broker} onChange={e => setBroker(e.target.value)} placeholder="اسم الوسيط" className="input-field" />
          <button onClick={addSponsor} className="md:col-span-2 lg:col-span-4 btn-primary flex items-center justify-center gap-2">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'حفظ الكفيل'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setName(''); setNid(''); setPhone(''); setBroker(''); }} className="md:col-span-2 lg:col-span-4 btn-secondary">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <ConfirmModal 
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="حذف كفيل"
          message="هل أنت متأكد من حذف هذا الكفيل وجميع العمال المرتبطين به؟ لا يمكن التراجع عن هذا الإجراء."
        />
        <table className="w-full text-right">
          <thead>
            <tr>
              <th>اسم الكفيل</th>
              <th>رقم الهوية</th>
              <th>الجوال</th>
              <th>الوسيط</th>
              <th>التاريخ</th>
              <th>عدد العمال</th>
              <th className="text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : sponsors.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">لا يوجد كفلاء مسجلين</td></tr>
            ) : sponsors.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{s.sponsor_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.national_id}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.phone}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.broker_name}</td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">{s.created_date}</td>
                <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-bold">{s.workers_count}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedSponsor(s);
                        fetchSponsorWorkers(s.id);
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-xs"
                    >
                      عرض العمال
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => startEdit(s)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteSponsor(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesPage({ currentUser }: { currentUser: any }) {
  const [sales, setSales] = useState<any[]>([]);
  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [client, setClient] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const fetchSales = async () => {
    const res = await fetch('/api/sales', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setSales(data);
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, []);

  const addSale = async () => {
    if (!service || !price || !client) return;
    if (editingId) {
      await fetch(`/api/sales/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ service, price: parseFloat(price), client })
      });
      setEditingId(null);
    } else {
      await fetch('/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ service, price: parseFloat(price), client })
      });
    }
    setService(''); setPrice(''); setClient('');
    fetchSales();
  };

  const deleteSale = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) return;
    await fetch(`/api/sales/${id}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    fetchSales();
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setService(s.service);
    setPrice(s.price.toString());
    setClient(s.client);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'تعديل مبيعات' : 'إضافة مبيعات جديدة'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input value={service} onChange={e => setService(e.target.value)} placeholder="الخدمة" className="input-field" />
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="السعر" className="input-field" />
          <input value={client} onChange={e => setClient(e.target.value)} placeholder="العميل" className="input-field" />
          <button onClick={addSale} className="md:col-span-3 btn-primary flex items-center justify-center gap-2">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'إضافة مبيعات'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setService(''); setPrice(''); setClient(''); }} className="md:col-span-3 btn-secondary">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-right">
          <thead>
            <tr>
              <th>الخدمة</th>
              <th>السعر</th>
              <th>العميل</th>
              {isAdmin && <th className="text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400">لا يوجد مبيعات مسجلة حالياً</td></tr>
            ) : sales.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{s.service}</td>
                <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-bold">{s.price} ر.س</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{s.client}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(s)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteSale(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersManagementPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);

  const isAdmin = currentUser?.role === 'super_admin';

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const fetchRoles = async () => {
    const res = await fetch('/api/admin/roles', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setRoles(data);
    if (data.length > 0 && !roleId) setRoleId(data[0].id.toString());
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchRoles();
  }, [refreshCounter]);

  const handleSubmit = async () => {
    if (!username || !fullName || (!editingUser && !password)) return;
    
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentUser?.id?.toString() || ''
      },
      body: JSON.stringify({ 
        username, 
        password: password || undefined, 
        full_name: fullName, 
        email, 
        phone, 
        role_id: parseInt(roleId),
        is_active: editingUser ? editingUser.is_active : 1,
        subscription_end: editingUser ? editingUser.subscription_end : undefined
      })
    });
    
    const data = await res.json();
    if (data.status === 'error') {
      alert(data.message);
    } else {
      resetForm();
      fetchUsers();
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setEmail('');
    setPhone('');
    setRoleId(roles[0]?.id.toString() || '');
    setEditingUser(null);
  };

  const deleteUser = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    await fetch(`/api/admin/users/${id}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    fetchUsers();
  };

  const toggleStatus = async (user: any) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentUser?.id?.toString() || ''
      },
      body: JSON.stringify({ 
        ...user,
        is_active: user.is_active === 1 ? 0 : 1
      })
    });
    fetchUsers();
  };

  const startEdit = (user: any) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.full_name);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setRoleId(user.role_id.toString());
    setPassword('');
  };

  const getSubscriptionStatus = (endDate: string) => {
    if (!endDate) return { label: 'غير محدد', color: 'text-slate-400' };
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'منتهي', color: 'text-rose-500 font-bold' };
    if (diffDays <= 7) return { label: `ينتهي خلال ${diffDays} أيام`, color: 'text-amber-500 font-bold' };
    return { label: `نشط (${diffDays} يوم)`, color: 'text-emerald-500' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
          <UserPlus size={20} className="text-cyan-500" />
          {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="الاسم الكامل" className="input-field" />
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="اسم المستخدم" className="input-field" disabled={!!editingUser} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editingUser ? "كلمة المرور (اتركها فارغة لعدم التغيير)" : "كلمة المرور"} className="input-field" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="input-field" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الجوال" className="input-field" />
          <select value={roleId} onChange={e => setRoleId(e.target.value)} className="input-field">
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.role_name === 'super_admin' ? 'مدير عام' : r.role_name === 'admin' ? 'مدير نظام' : 'مستخدم عادي'}</option>
            ))}
          </select>
          <div className="lg:col-span-3 flex gap-2">
            <button onClick={handleSubmit} className="flex-1 btn-primary flex items-center justify-center gap-2">
              <Save size={18} /> {editingUser ? 'تحديث البيانات' : 'حفظ المستخدم'}
            </button>
            {editingUser && (
              <button onClick={resetForm} className="btn-secondary">إلغاء</button>
            )}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-right">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>بيانات الاتصال</th>
              <th>الصلاحية</th>
              <th>الاشتراك</th>
              <th>الحالة</th>
              <th className="text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">لا يوجد مستخدمين مسجلين</td></tr>
            ) : users.map((u: any) => {
              const sub = getSubscriptionStatus(u.subscription_end);
              return (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{u.full_name}</div>
                    <div className="text-xs text-slate-500">@{u.username}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-slate-600 dark:text-slate-400">{u.email || '-'}</div>
                    <div className="text-slate-500 text-xs">{u.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role_name === 'admin' || u.role_name === 'super_admin' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {u.role_name === 'super_admin' ? 'مدير عام' : u.role_name === 'admin' ? 'مدير نظام' : 'مستخدم عادي'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${sub.color}`}>
                    {sub.label}
                    <div className="text-[10px] opacity-70">{u.subscription_end || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button 
                      onClick={() => toggleStatus(u)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${u.is_active === 1 ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {u.is_active === 1 ? 'نشط' : 'معطل'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(u)} className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl transition-colors">
                        <Edit2 size={18} />
                      </button>
                      {u.username !== '1095972897' && (
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
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
  );
}

function ExpensesPage({ currentUser }: { currentUser: any }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const fetchExpenses = async () => {
    const res = await fetch('/api/expenses', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const addExpense = async () => {
    if (!title || !amount) return;
    if (editingId) {
      await fetch(`/api/expenses/${editingId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ title, amount: parseFloat(amount) })
      });
      setEditingId(null);
    } else {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ title, amount: parseFloat(amount) })
      });
    }
    setTitle(''); setAmount('');
    fetchExpenses();
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    await fetch(`/api/expenses/${id}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    fetchExpenses();
  };

  const startEdit = (e: any) => {
    setEditingId(e.id);
    setTitle(e.title);
    setAmount(e.amount.toString());
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold mb-4 dark:text-white">{editingId ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="المصروف" className="input-field" />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="المبلغ" className="input-field" />
          <button onClick={addExpense} className="md:col-span-2 btn-primary flex items-center justify-center gap-2">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'إضافة مصروف'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setTitle(''); setAmount(''); }} className="md:col-span-2 btn-secondary">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-right">
          <thead>
            <tr>
              <th>المصروف</th>
              <th>المبلغ</th>
              {isAdmin && <th className="text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={isAdmin ? 3 : 2} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={isAdmin ? 3 : 2} className="px-6 py-12 text-center text-slate-400">لا يوجد مصروفات مسجلة حالياً</td></tr>
            ) : expenses.map((e: any) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{e.title}</td>
                <td className="px-6 py-4 text-sm text-rose-600 dark:text-rose-400 font-bold">{e.amount} ر.س</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(e)} className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteExpense(e.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsPage({ currentUser }: { currentUser: any }) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    const res = await fetch('/api/admin/reports', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setReportData(data);
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 text-sm mb-1">المستخدمين الجدد (هذا الشهر)</div>
          <div className="text-3xl font-bold text-cyan-500">{reportData.newUsersCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 text-sm mb-1">الاشتراكات النشطة</div>
          <div className="text-3xl font-bold text-emerald-500">{reportData.activeSubscriptions}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="text-slate-500 text-sm mb-1">الاشتراكات المنتهية</div>
          <div className="text-3xl font-bold text-rose-500">{reportData.expiredSubscriptions}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold mb-4 dark:text-white">توزيع الصلاحيات</h3>
        <div className="space-y-4">
          {reportData.roleDistribution.map((rd: any) => (
            <div key={rd.role_name} className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">{rd.role_name === 'super_admin' ? 'مدير عام' : rd.role_name === 'admin' ? 'مدير نظام' : 'مستخدم عادي'}</span>
              <div className="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500" 
                  style={{ width: `${(rd.count / reportData.totalUsers) * 100}%` }}
                />
              </div>
              <span className="font-bold dark:text-white">{rd.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold mb-4 dark:text-white">أحدث النشاطات</h3>
        <div className="space-y-3">
          {reportData.recentLogs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <div className="text-sm font-medium dark:text-white">{log.action}</div>
                <div className="text-xs text-slate-500">{log.details}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-cyan-500">{log.user_name || 'النظام'}</div>
                <div className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString('ar-SA')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main App with Login ---

export default function App() {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isDarkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
        setCurrentUser({
          id: user.uid,
          full_name: user.displayName,
          email: user.email,
          role: 'admin' // Default role
        });
      } else {
        setLoggedIn(false);
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError('تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات في متصفحك أو فتح التطبيق في نافذة جديدة.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setLoginError('تم إلغاء طلب تسجيل الدخول السابق. يرجى المحاولة مرة أخرى.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setLoginError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else {
        setLoginError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const secureFetch = async (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
      'X-User-Id': currentUser?.id?.toString() || ''
    };
    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      // Fetch initial unread count
      const fetchUnread = async () => {
        const res = await secureFetch('/api/stats');
        const data = await res.json();
        setUnreadCount(data.unreadMessages);
      };
      fetchUnread();

      // Setup WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          if (activeTab !== 'messages') {
            setUnreadCount(prev => prev + 1);
          }
        } else if (data.type === 'notification') {
          // You could use a toast library here, but we'll use a simple alert for now
          // or better, a custom notification state
          alert(data.message);
          if (activeTab === 'file_analysis' || activeTab === 'clients') {
            setRefreshCounter(prev => prev + 1);
          }
        }
      };

      return () => ws.close();
    }
  }, [isLoggedIn, currentUser, activeTab]);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'workers':
        return <WorkersPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'worker_followup':
        return <WorkerFollowupPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'sponsors':
        return <SponsorsPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'accounting':
        return <AccountingPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'messages':
        return <MessagingPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'admin_users':
        return <UsersManagementPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'admin_reports':
        return <ReportsPage currentUser={currentUser} />;
      case 'admin_settings':
        return <SystemSettings currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'admin_logs':
        return <ActivityLogs currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'permissions':
        return <UsersManagementPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'tasks':
        return <TasksPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'file_analysis':
        return <FileManagementPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'agents':
        return <AgentsPage />;
      case 'ai_advisor':
        return <AIAdvisor currentUser={currentUser} />;
      case 'clients':
        return <ClientsPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'brokers':
        return <BrokersDuesPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'debts':
        return <SalesDebtsPage currentUser={currentUser} refreshCounter={refreshCounter} />;
      case 'reports':
      case 'expenses':
      case 'attendance':
        return (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
              {SECTIONS.find(s => s.id === activeTab)?.icon}
            </div>
            <h2 className="text-2xl font-bold mb-4 dark:text-white">قسم {SECTIONS.find(s => s.id === activeTab)?.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              هذا القسم متاح حالياً من خلال صفحة "المحاسبة المتكاملة" أو "إدارة العمال". سيتم تخصيص واجهة منفصلة له قريباً لزيادة كفاءة الوصول.
            </p>
            <button 
              onClick={() => setActiveTab('accounting')}
              className="mt-8 btn-primary"
            >
              الانتقال للمحاسبة المتكاملة
            </button>
          </div>
        );
      default:
        return (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">قسم {SECTIONS.find(s => s.id === activeTab)?.title}</h2>
            <p className="text-slate-500 dark:text-slate-400">هذا القسم قيد التطوير حالياً كجزء من نظام حلول المتكامل.</p>
          </div>
        );
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!showLogin) {
      return <LandingPage onLoginClick={() => setShowLogin(true)} />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 relative"
        >
          <div className="text-center mb-10">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6 flex justify-center">
              <Logo className="w-24 h-24" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">حلول</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">مرحباً بك، يرجى تسجيل الدخول للمتابعة</p>
            {isIframe && (
              <p className="text-amber-500 text-xs font-bold mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={12} />
                تنبيه: إذا واجهت مشكلة في تسجيل الدخول، افتح التطبيق في نافذة جديدة.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {loginError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex flex-col gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{loginError}</p>
                </div>
                {loginError.includes('حظر') && (
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="py-2 px-4 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all self-start flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    فتح التطبيق في نافذة مستقلة
                  </button>
                )}
              </div>
            )}
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  تسجيل الدخول بواسطة جوجل
                </>
              )}
            </button>
            <button 
              onClick={() => setShowLogin(false)}
              className="w-full py-3 text-slate-400 dark:text-slate-500 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-300 transition-all"
            >
              العودة للرئيسية
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'messages') {
      setUnreadCount(0);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300`}>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 80,
          x: typeof window !== 'undefined' && window.innerWidth < 1024 
            ? (isMobileMenuOpen ? 0 : 300) 
            : 0
        }}
        className={`fixed top-0 right-0 h-full ${isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-slate-200'} border-l z-50 flex flex-col shadow-2xl transition-colors duration-300`}
      >
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Logo className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>حلول</span>
            </motion.div>
          )}
          <button 
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileMenuOpen(false);
              } else {
                setSidebarOpen(!isSidebarOpen);
              }
            }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {SECTIONS.filter(s => {
            if (currentUser?.role === 'super_admin') return true;
            if (currentUser?.role === 'admin') {
              return !['admin_users', 'admin_settings', 'admin_logs', 'admin_reports'].includes(s.id);
            }
            // Regular user
            return !['admin_users', 'admin_settings', 'admin_logs', 'permissions', 'reports', 'expenses', 'admin_reports'].includes(s.id);
          }).map((section) => (
            <button
              key={section.id}
              onClick={() => {
                handleTabChange(section.id);
                if (window.innerWidth < 1024) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group ${
                activeTab === section.id 
                ? 'bg-[#00BFFF] text-white shadow-lg shadow-[#00BFFF]/20' 
                : `${isDarkMode ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`
              }`}
            >
              <span className={`${activeTab === section.id ? 'text-white' : 'text-slate-500 group-hover:text-[#00BFFF]'}`}>
                {section.icon}
              </span>
              {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-medium whitespace-nowrap flex-1 text-right"
                >
                  {section.title}
                </motion.span>
              )}
              {section.id === 'messages' && (isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && unreadCount > 0 && (
                <div className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
              currentUser?.role === 'super_admin' ? 'bg-rose-600 shadow-rose-100 dark:shadow-none' : 
              currentUser?.role === 'admin' ? 'bg-emerald-600 shadow-emerald-100 dark:shadow-none' : 'bg-slate-600 shadow-slate-100 dark:shadow-none'
            }`}>
              {currentUser?.full_name?.charAt(0)}
            </div>
            {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
              <div className="flex-1 min-w-0 text-right">
                <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser?.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentUser?.role === 'super_admin' ? 'مدير عام' : 
                   currentUser?.role === 'admin' ? 'مدير نظام' : 'موظف'}
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              setLoggedIn(false);
              setCurrentUser(null);
            }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${
              isDarkMode ? 'text-rose-400 hover:bg-rose-900/20' : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <LogOut size={20} />
            {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && <span className="text-sm font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300 min-w-0"
        style={{ marginRight: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (isSidebarOpen ? 280 : 80) : 0 }}
      >
        {/* Header */}
        <header className={`sticky top-0 z-40 ${isDarkMode ? 'bg-[#121212]/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-md border-b px-4 lg:px-8 py-4 flex items-center justify-between transition-colors duration-300`}>
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 lg:hidden hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400`}
            >
              <Menu size={24} />
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن ملف، عميل، أو فاتورة..." 
                className={`w-full pr-12 pl-4 py-2.5 ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl text-sm focus:ring-2 focus:ring-[#00BFFF]/20 outline-none transition-all`}
              />
            </div>
          </div>
          
          {currentUser?.subscription_end && (
            (() => {
              const today = new Date();
              const end = new Date(currentUser.subscription_end);
              const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays <= 7 && diffDays >= 0) {
                return (
                  <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold animate-pulse mx-4">
                    <AlertCircle size={14} />
                    <span>ينتهي اشتراكك خلال {diffDays} أيام</span>
                  </div>
                );
              }
              return null;
            })()
          )}

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setRefreshCounter(prev => prev + 1)}
              className="hidden sm:flex items-center gap-2 p-2.5 text-[#00BFFF] hover:bg-[#00BFFF]/10 rounded-2xl transition-colors font-bold text-sm"
              title="تحديث البيانات"
            >
              <RefreshCcw size={20} />
              <span className="hidden lg:inline">تحديث البيانات</span>
            </button>
            <button 
              onClick={() => setDarkMode(!isDarkMode)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 lg:mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-left hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser?.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                  {currentUser?.role === 'super_admin' ? 'مدير عام' : 
                   currentUser?.role === 'admin' ? 'مدير النظام' : 'موظف'}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 border-2 border-white dark:border-slate-800 shadow-sm">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {SECTIONS.find(s => s.id === activeTab)?.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm lg:text-base">
                {SECTIONS.find(s => s.id === activeTab)?.description}
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none btn-secondary">
                تصدير تقرير
              </button>
              <button className="flex-1 sm:flex-none btn-primary">
                إضافة جديد
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-8 px-8 border-t border-slate-200 dark:border-slate-800 text-center lg:text-right">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              نظام حلول لإدارة المؤسسات - الإصدار 2.5.0
            </p>
            <div className="flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <a href="#" className="hover:text-emerald-500 transition-colors">الدعم الفني</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">شروط الاستخدام</a>
            </div>
          </div>
        </footer>
        <AIChatbot currentUser={currentUser} />
      </main>
    </div>
  );
}
