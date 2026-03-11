import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Edit2
} from 'lucide-react';
import { SECTIONS } from './constants';
import Dashboard from './components/Dashboard';
import UserManual from './components/UserManual';
import MessagingPage from './components/MessagingPage';
import AccountingPage from './components/AccountingPage';
import UserManagement from './components/UserManagement';
import SystemSettings from './components/SystemSettings';
import ActivityLogs from './components/ActivityLogs';
import ConfirmModal from './components/ConfirmModal';

// --- Components for the new sections ---

function WorkersPage({ currentUser }: { currentUser: any }) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [job, setJob] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  
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

  useEffect(() => { fetchWorkers(); }, []);

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
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.sponsor.toLowerCase().includes(searchTerm.toLowerCase())
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
        body: JSON.stringify({ name, job, sponsor })
      });
      setEditingId(null);
    } else {
      await fetch('/api/workers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({ name, job, sponsor })
      });
    }
    setName(''); setJob(''); setSponsor('');
    fetchWorkers();
  };

  const deleteWorker = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العامل؟')) return;
    await fetch(`/api/workers/${id}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    fetchWorkers();
  };

  const startEdit = (w: any) => {
    setEditingId(w.id);
    setName(w.name);
    setJob(w.job);
    setSponsor(w.sponsor);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp size={14} className="text-emerald-500" /> : <ArrowDown size={14} className="text-emerald-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'تعديل بيانات عامل' : 'إضافة عامل جديد'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم العامل" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input value={job} onChange={e => setJob(e.target.value)} placeholder="المهنة" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input value={sponsor} onChange={e => setSponsor(e.target.value)} placeholder="الكفيل" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <button onClick={addWorker} className="md:col-span-3 bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'إضافة عامل'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setName(''); setJob(''); setSponsor(''); }} className="md:col-span-3 bg-slate-200 text-slate-700 py-2 rounded-xl font-bold hover:bg-slate-300 transition-colors">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="بحث في قائمة العمال..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Filter size={14} />
            <span>إجمالي النتائج: {filteredWorkers.length}</span>
          </div>
        </div>
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th 
                className="px-6 py-4 text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  الاسم <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('job')}
              >
                <div className="flex items-center gap-2">
                  المهنة <SortIcon field="job" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => handleSort('sponsor')}
              >
                <div className="flex items-center gap-2">
                  الكفيل <SortIcon field="sponsor" />
                </div>
              </th>
              {isAdmin && <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400">لا يوجد نتائج تطابق بحثك</td></tr>
            ) : currentItems.map((w: any) => (
              <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{w.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{w.job}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{w.sponsor}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(w)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteWorker(w.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500">
              عرض {indexOfFirstItem + 1} إلى {Math.min(indexOfLastItem, filteredWorkers.length)} من أصل {filteredWorkers.length}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
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
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
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

function SponsorsPage({ currentUser }: { currentUser: any }) {
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

  const isAdmin = currentUser?.role === 'admin';

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

  useEffect(() => { fetchSponsors(); }, []);

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
    if (!confirm('هل أنت متأكد من حذف هذا الكفيل وجميع العمال المرتبطين به؟')) return;
    await fetch(`/api/sponsors/${id}`, { 
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
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
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ChevronLeft className="rotate-180" size={24} />
          </button>
          <h2 className="text-2xl font-bold">عمال الكفيل: {selectedSponsor.sponsor_name}</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4">إضافة عامل لهذا الكفيل</h3>
          <div className="flex gap-4">
            <input 
              value={newWorkerName} 
              onChange={e => setNewWorkerName(e.target.value)} 
              placeholder="اسم العامل" 
              className="flex-1 px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" 
            />
            <button 
              onClick={addSponsoredWorker} 
              className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              إضافة
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم العامل</th>
                {isAdmin && <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sponsorWorkers.length === 0 ? (
                <tr><td colSpan={isAdmin ? 2 : 1} className="px-6 py-12 text-center text-slate-400">لا يوجد عمال لهذا الكفيل</td></tr>
              ) : sponsorWorkers.map((w: any) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900">{w.worker_name}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-sm text-center">
                      <button onClick={() => deleteSponsoredWorker(w.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
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
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'تعديل بيانات كفيل' : 'إضافة كفيل جديد'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم الكفيل" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input value={nid} onChange={e => setNid(e.target.value)} placeholder="رقم الهوية" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الجوال" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input value={broker} onChange={e => setBroker(e.target.value)} placeholder="اسم الوسيط" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <button onClick={addSponsor} className="md:col-span-2 lg:col-span-4 bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'حفظ الكفيل'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setName(''); setNid(''); setPhone(''); setBroker(''); }} className="md:col-span-2 lg:col-span-4 bg-slate-200 text-slate-700 py-2 rounded-xl font-bold hover:bg-slate-300 transition-colors">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم الكفيل</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الهوية</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الجوال</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الوسيط</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">عدد العمال</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : sponsors.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">لا يوجد كفلاء مسجلين</td></tr>
            ) : sponsors.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{s.sponsor_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.national_id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.phone}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.broker_name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{s.created_date}</td>
                <td className="px-6 py-4 text-sm text-emerald-600 font-bold">{s.workers_count}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedSponsor(s);
                        fetchSponsorWorkers(s.id);
                      }}
                      className="text-emerald-600 hover:underline font-bold text-xs"
                    >
                      عرض العمال
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => startEdit(s)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteSponsor(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
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

  const isAdmin = currentUser?.role === 'admin';

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
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'تعديل مبيعات' : 'إضافة مبيعات جديدة'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input value={service} onChange={e => setService(e.target.value)} placeholder="الخدمة" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="السعر" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input value={client} onChange={e => setClient(e.target.value)} placeholder="العميل" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <button onClick={addSale} className="md:col-span-3 bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'إضافة مبيعات'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setService(''); setPrice(''); setClient(''); }} className="md:col-span-3 bg-slate-200 text-slate-700 py-2 rounded-xl font-bold hover:bg-slate-300 transition-colors">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الخدمة</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">السعر</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">العميل</th>
              {isAdmin && <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400">لا يوجد مبيعات مسجلة حالياً</td></tr>
            ) : sales.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{s.service}</td>
                <td className="px-6 py-4 text-sm text-emerald-600 font-bold">{s.price} ر.س</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.client}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(s)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteSale(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
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

function UsersManagementPage({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role === 'admin';

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const addUser = async () => {
    if (!username || !password || !fullName) return;
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, full_name: fullName, role })
    });
    const data = await res.json();
    if (data.status === 'error') {
      alert(data.message);
    } else {
      setUsername(''); setPassword(''); setFullName(''); setRole('user');
      fetchUsers();
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-emerald-600" />
          إضافة مستخدم جديد
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="الاسم الكامل" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="اسم المستخدم" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <select value={role} onChange={e => setRole(e.target.value)} className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="user">مستخدم عادي</option>
            <option value="admin">مدير نظام</option>
          </select>
          <button onClick={addUser} className="md:col-span-2 lg:col-span-4 bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
            <Plus size={18} /> حفظ المستخدم
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الاسم الكامل</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم المستخدم</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الصلاحية</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">لا يوجد مستخدمين مسجلين</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{u.full_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{u.username}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {u.role === 'admin' ? 'مدير نظام' : 'مستخدم عادي'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  {isAdmin && u.username !== '1095972897' && (
                    <button 
                      onClick={() => deleteUser(u.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="حذف المستخدم"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
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

  const isAdmin = currentUser?.role === 'admin';

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
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="المصروف" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="المبلغ" className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
          <button onClick={addExpense} className="md:col-span-2 bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
            <Plus size={18} /> {editingId ? 'تحديث البيانات' : 'إضافة مصروف'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setTitle(''); setAmount(''); }} className="md:col-span-2 bg-slate-200 text-slate-700 py-2 rounded-xl font-bold hover:bg-slate-300 transition-colors">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">المصروف</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">المبلغ</th>
              {isAdmin && <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={isAdmin ? 3 : 2} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={isAdmin ? 3 : 2} className="px-6 py-12 text-center text-slate-400">لا يوجد مصروفات مسجلة حالياً</td></tr>
            ) : expenses.map((e: any) => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{e.title}</td>
                <td className="px-6 py-4 text-sm text-rose-600 font-bold">{e.amount} ر.س</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(e)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteExpense(e.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
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

// --- Main App with Login ---

export default function App() {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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
            // Optional: Show a browser notification or toast here
          }
        }
      };

      return () => ws.close();
    }
  }, [isLoggedIn, currentUser, activeTab]);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setCurrentUser(data.user);
        setLoggedIn(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />;
      case 'manual':
        return <UserManual />;
      case 'workers':
        return <WorkersPage currentUser={currentUser} />;
      case 'sponsors':
        return <SponsorsPage currentUser={currentUser} />;
      case 'accounting':
        return <AccountingPage currentUser={currentUser} />;
      case 'messages':
        return <MessagingPage currentUser={currentUser} />;
      case 'admin_users':
        return <UserManagement currentUser={currentUser} />;
      case 'admin_settings':
        return <SystemSettings currentUser={currentUser} />;
      case 'admin_logs':
        return <ActivityLogs currentUser={currentUser} />;
      case 'permissions':
        return <UsersManagementPage currentUser={currentUser} />;
      case 'video':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <ChevronLeft className="rotate-180" fill="currentColor" />
                </div>
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold mb-2">العرض التوضيحي التفاعلي</h2>
            <p className="text-slate-500 max-w-md">
              هذا القسم مخصص لعرض فيديو تفاعلي يشرح واجهة النظام. سيتم دمج مشغل الفيديو هنا قريباً.
            </p>
            <button className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
              بدء العرض الآن
            </button>
          </div>
        );
      default:
        return (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
            <h2 className="text-2xl font-bold mb-4">قسم {SECTIONS.find(s => s.id === activeTab)?.title}</h2>
            <p className="text-slate-500">هذا القسم قيد التطوير حالياً كجزء من نظام ثقة المتكامل.</p>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-emerald-200 mx-auto mb-6">
              ث
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">نظام ثقة</h1>
            <p className="text-slate-500 mt-2">مرحباً بك، يرجى تسجيل الدخول للمتابعة</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">اسم المستخدم</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 mt-4"
            >
              تسجيل الدخول
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
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed top-0 right-0 h-full bg-white border-l border-slate-200 z-50 flex flex-col shadow-xl shadow-slate-200/50"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">
                ث
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">نظام ثقة</span>
            </motion.div>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {SECTIONS.filter(s => {
            if (currentUser?.role === 'super_admin') return true;
            if (currentUser?.role === 'admin') {
              return !['admin_users', 'admin_settings', 'admin_logs'].includes(s.id);
            }
            // Regular user
            return !['admin_users', 'admin_settings', 'admin_logs', 'permissions', 'reports', 'expenses'].includes(s.id);
          }).map((section) => (
            <button
              key={section.id}
              onClick={() => handleTabChange(section.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group ${
                activeTab === section.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`${activeTab === section.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`}>
                {section.icon}
              </span>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-medium whitespace-nowrap flex-1"
                >
                  {section.title}
                </motion.span>
              )}
              {section.id === 'messages' && isSidebarOpen && unreadCount > 0 && (
                <div className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
              currentUser?.role === 'super_admin' ? 'bg-rose-600 shadow-rose-100' : 
              currentUser?.role === 'admin' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-slate-600 shadow-slate-100'
            }`}>
              {currentUser?.full_name?.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{currentUser?.full_name}</p>
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
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300"
        style={{ marginRight: isSidebarOpen ? 280 : 80 }}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن ملف، عميل، أو فاتورة..." 
                className="w-full pr-12 pl-4 py-2.5 bg-slate-100/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-left hidden sm:block text-right">
                <p className="text-sm font-bold text-slate-900">{currentUser?.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                  {currentUser?.role === 'super_admin' ? 'مدير عام' : 
                   currentUser?.role === 'admin' ? 'مدير النظام' : 'موظف'}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500 border-2 border-white shadow-sm">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {SECTIONS.find(s => s.id === activeTab)?.title}
              </h1>
              <p className="text-slate-500 mt-1">
                {SECTIONS.find(s => s.id === activeTab)?.description}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors">
                تصدير تقرير
              </button>
              <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
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
      </main>
    </div>
  );
}
