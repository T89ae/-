import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

interface BrokerDue {
  id: number;
  broker_name: string;
  service_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'waiting' | 'completed' | 'late';
  created_at: string;
  notes: string;
}

export default function BrokersDuesPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [dues, setDues] = useState<BrokerDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDue, setEditingDue] = useState<BrokerDue | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [dueToDelete, setDueToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    late: 0
  });

  const [formData, setFormData] = useState({
    broker_name: '',
    service_name: '',
    total_amount: '',
    paid_amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchDues();
  }, [refreshCounter]);

  const fetchDues = async () => {
    try {
      const response = await fetch('/api/broker-dues');
      const data = await response.json();
      setDues(data);
      calculateStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dues:', error);
    }
  };

  const calculateStats = (dueList: BrokerDue[]) => {
    const newStats = dueList.reduce((acc, due) => {
      acc.total += due.total_amount;
      acc.paid += due.paid_amount;
      if (due.status === 'late') acc.late++;
      return acc;
    }, { total: 0, paid: 0, late: 0 });
    setStats(newStats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDue ? 'PUT' : 'POST';
    const url = editingDue ? `/api/broker-dues/${editingDue.id}` : '/api/broker-dues';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingDue(null);
        setFormData({
          broker_name: '',
          service_name: '',
          total_amount: '',
          paid_amount: '',
          notes: ''
        });
        fetchDues();
      }
    } catch (error) {
      console.error('Error saving due:', error);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const due = dues.find(d => d.id === id);
    if (!due) return;

    try {
      await fetch(`/api/broker-dues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...due, status: newStatus })
      });
      fetchDues();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    setDueToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!dueToDelete) return;
    try {
      await fetch(`/api/broker-dues/${dueToDelete}`, { method: 'DELETE' });
      fetchDues();
    } catch (error) {
      console.error('Error deleting due:', error);
    }
  };

  const filteredDues = dues.filter(due => {
    const matchesSearch = due.broker_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         due.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || due.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">منجز</span>;
      case 'late':
        return <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">متأخر</span>;
      default:
        return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">انتظار</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">إجمالي المستحقات</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.total?.toLocaleString() || 0} ر.س</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">المبالغ المسددة</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.paid?.toLocaleString() || 0} ر.س</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">العمليات المتأخرة</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.late}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ابحث عن وسيط أو خدمة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white"
          >
            <option value="all">كل العمليات</option>
            <option value="waiting">انتظار</option>
            <option value="completed">منجزة</option>
            <option value="late">متأخرة</option>
          </select>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary w-full md:w-auto flex items-center gap-2 justify-center"
        >
          <Plus size={20} />
          إضافة مستحق جديد
        </button>
      </div>

      {/* Dues Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-bold text-slate-400">رقم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">اسم الوسيط</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الخدمة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">المبلغ الكلي</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">المسدد</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">المتبقي</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredDues.map((due, index) => (
                <tr 
                  key={due.id}
                  className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                    due.status === 'completed' ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : 
                    due.status === 'late' ? 'bg-rose-50/30 dark:bg-rose-900/5' : 
                    due.status === 'waiting' ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{due.broker_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{due.service_name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{due.total_amount?.toLocaleString() || 0} ر.س</td>
                  <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400">{due.paid_amount?.toLocaleString() || 0} ر.س</td>
                  <td className="px-6 py-4 text-sm text-rose-600 dark:text-rose-400">{due.remaining_amount?.toLocaleString() || 0} ر.س</td>
                  <td className="px-6 py-4">
                    {getStatusBadge(due.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleStatusChange(due.id, 'completed')}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                        title="إنجاز"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(due.id, 'waiting')}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="انتظار"
                      >
                        <Clock size={18} />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(due.id, 'late')}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        title="متأخر"
                      >
                        <AlertCircle size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingDue(due);
                          setFormData({
                            broker_name: due.broker_name,
                            service_name: due.service_name,
                            total_amount: due.total_amount.toString(),
                            paid_amount: due.paid_amount.toString(),
                            notes: due.notes
                          });
                          setShowForm(true);
                        }}
                        className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(due.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDues.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    لا توجد مستحقات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Due Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-2xl font-black dark:text-white">
                  {editingDue ? 'تعديل المستحق' : 'إضافة مستحق جديد'}
                </h2>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم الوسيط</label>
                    <input 
                      required
                      type="text"
                      value={formData.broker_name}
                      onChange={e => setFormData({...formData, broker_name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="اسم الوسيط"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم الخدمة</label>
                    <input 
                      required
                      type="text"
                      value={formData.service_name}
                      onChange={e => setFormData({...formData, service_name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="نوع الخدمة"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">المبلغ الكلي</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="number"
                        value={formData.total_amount}
                        onChange={e => setFormData({...formData, total_amount: e.target.value})}
                        className="w-full pr-12 pl-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">المبلغ المسدد</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="number"
                        value={formData.paid_amount}
                        onChange={e => setFormData({...formData, paid_amount: e.target.value})}
                        className="w-full pr-12 pl-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">المبلغ المتبقي</label>
                  <div className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-slate-500 dark:text-slate-400 font-bold">
                    {(parseFloat(formData.total_amount) || 0) - (parseFloat(formData.paid_amount) || 0)} ر.س
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">ملاحظات</label>
                  <textarea 
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white resize-none"
                    placeholder="أي ملاحظات إضافية..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                  >
                    {editingDue ? 'تحديث العملية' : 'حفظ العملية'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف المستحق"
        message="هل أنت متأكد من حذف هذا المستحق؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
}
