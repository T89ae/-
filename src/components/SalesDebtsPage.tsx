import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Calendar,
  User,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

interface Sale {
  id: number;
  service: string;
  price: number;
  wholesale_price: number;
  net_profit: number;
  supplier_name: string;
  paid_amount: number;
  remaining_amount: number;
  date: string;
  client: string;
}

export default function SalesDebtsPage({ currentUser, refreshCounter, token }: { currentUser: any, refreshCounter?: number, token: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalDebts: 0
  });

  const [formData, setFormData] = useState({
    service: '',
    price: '',
    wholesale_price: '',
    supplier_name: '',
    paid_amount: '',
    client: ''
  });

  useEffect(() => {
    fetchSales();
  }, [refreshCounter]);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': currentUser?.id?.toString() || '' 
        }
      });
      const data = await response.json();
      setSales(data);
      calculateStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const calculateStats = (saleList: Sale[]) => {
    const newStats = saleList.reduce((acc, sale) => {
      acc.totalSales += (sale.price || 0);
      acc.totalProfit += (sale.net_profit || 0);
      acc.totalDebts += (sale.remaining_amount || 0);
      return acc;
    }, { totalSales: 0, totalProfit: 0, totalDebts: 0 });
    setStats(newStats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSale ? 'PUT' : 'POST';
    const url = editingSale ? `/api/sales/${editingSale.id}` : '/api/sales';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          wholesale_price: parseFloat(formData.wholesale_price),
          paid_amount: parseFloat(formData.paid_amount)
        })
      });

      if (response.ok) {
        setShowForm(false);
        setEditingSale(null);
        setFormData({
          service: '',
          price: '',
          wholesale_price: '',
          supplier_name: '',
          paid_amount: '',
          client: ''
        });
        fetchSales();
      }
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleDelete = async (id: number) => {
    setSaleToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;
    try {
      await fetch(`/api/sales/${saleToDelete}`, { method: 'DELETE' });
      fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = (sale.service?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (sale.supplier_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (sale.client?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'debt' && (sale.remaining_amount || 0) > 0) ||
                         (filterStatus === 'paid' && (sale.remaining_amount || 0) === 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">إجمالي المبيعات</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.totalSales?.toLocaleString() || 0} ر.س</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">صافي الأرباح</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.totalProfit?.toLocaleString() || 0} ر.س</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center">
              <ArrowDownRight size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">إجمالي الديون</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.totalDebts?.toLocaleString() || 0} ر.س</h3>
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
              placeholder="ابحث عن خدمة، مورد، أو عميل..."
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
            <option value="debt">ديون</option>
            <option value="paid">مدفوعة بالكامل</option>
          </select>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary w-full md:w-auto flex items-center gap-2 justify-center"
        >
          <Plus size={20} />
          إضافة مبيعات جديدة
        </button>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-bold text-slate-400">رقم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الخدمة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">العميل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">المورد</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">سعر البيع</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">سعر الجملة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الربح</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">المسدد</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">المتبقي</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale, index) => (
                <tr 
                  key={sale.id}
                  className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{sale.service}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sale.date ? new Date(sale.date).toLocaleString('ar-SA') : '---'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{sale.client}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{sale.supplier_name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{sale.price?.toLocaleString() || 0} ر.س</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{sale.wholesale_price?.toLocaleString() || 0} ر.س</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{sale.net_profit?.toLocaleString() || 0} ر.س</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400">{sale.paid_amount?.toLocaleString() || 0} ر.س</td>
                  <td className="px-6 py-4">
                    {(sale.remaining_amount || 0) > 0 ? (
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{sale.remaining_amount?.toLocaleString() || 0} ر.س</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold">مدفوع</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingSale(sale);
                          setFormData({
                            service: sale.service || '',
                            price: (sale.price || 0).toString(),
                            wholesale_price: (sale.wholesale_price || 0).toString(),
                            supplier_name: sale.supplier_name || '',
                            paid_amount: (sale.paid_amount || 0).toString(),
                            client: sale.client || ''
                          });
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sale.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    لا توجد مبيعات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Form Modal */}
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
                  {editingSale ? 'تعديل العملية' : 'إضافة مبيعات جديدة'}
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
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم الخدمة</label>
                    <input 
                      required
                      type="text"
                      value={formData.service}
                      onChange={e => setFormData({...formData, service: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="مثلاً: تأشيرة زيارة"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم العميل</label>
                    <input 
                      required
                      type="text"
                      value={formData.client}
                      onChange={e => setFormData({...formData, client: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="اسم العميل"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم المورد</label>
                    <input 
                      required
                      type="text"
                      value={formData.supplier_name}
                      onChange={e => setFormData({...formData, supplier_name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="اسم المورد"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">سعر البيع</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="w-full pr-12 pl-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">سعر الجملة</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="number"
                        value={formData.wholesale_price}
                        onChange={e => setFormData({...formData, wholesale_price: e.target.value})}
                        className="w-full pr-12 pl-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">المبلغ المسدد</label>
                    <div className="relative">
                      <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-500 mb-1">صافي الربح المتوقع</p>
                    <p className="text-xl font-black dark:text-white">
                      {(parseFloat(formData.price) || 0) - (parseFloat(formData.wholesale_price) || 0)} ر.س
                    </p>
                  </div>
                  <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                    <p className="text-xs font-bold text-rose-500 mb-1">المبلغ المتبقي (دين)</p>
                    <p className="text-xl font-black dark:text-white">
                      {(parseFloat(formData.price) || 0) - (parseFloat(formData.paid_amount) || 0)} ر.س
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#00BFFF] text-white rounded-2xl font-bold text-lg hover:bg-[#0099CC] transition-all shadow-lg shadow-[#00BFFF]/20"
                  >
                    {editingSale ? 'تحديث العملية' : 'حفظ العملية'}
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
        title="حذف العملية"
        message="هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
}
