import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Printer, TrendingUp, TrendingDown, 
  DollarSign, Package, CreditCard, Calendar, FileText, Loader2, 
  Edit2, Trash2, CheckCircle, AlertCircle, Clock, PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- Types ---
interface Debt {
  id: number;
  type: 'creditor' | 'debtor';
  person_name: string;
  amount: number;
  due_date: string;
  description: string;
  status: 'unpaid' | 'paid' | 'late';
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  type: 'regular' | 'establishment';
  moaqeb_name?: string;
  service_name?: string;
}

interface FinancialReport {
  totalSales: number;
  totalExpenses: number;
  totalDebts: number;
  netProfit: number;
  salesByCategory: { category: string; total: number }[];
  expensesByCategory: { category: string; total: number }[];
}

// --- Components ---

export default function AccountingPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [activeTab, setActiveTab] = useState('reports');
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'reports', title: 'التقارير المالية', icon: <BarChartIcon size={18} /> },
          { id: 'sales', title: 'المبيعات والفواتير', icon: <FileText size={18} /> },
          { id: 'debts', title: 'إدارة الديون', icon: <CreditCard size={18} /> },
          { id: 'inventory', title: 'الجرد والمخزون', icon: <Package size={18} /> },
          { id: 'expenses', title: 'النفقات', icon: <TrendingDown size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800'
            }`}
          >
            {tab.icon}
            {tab.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'reports' && <FinancialReports currentUser={currentUser} isAdmin={isAdmin} refreshCounter={refreshCounter} />}
          {activeTab === 'sales' && <SalesManagement currentUser={currentUser} isAdmin={isAdmin} refreshCounter={refreshCounter} />}
          {activeTab === 'debts' && <DebtManagement currentUser={currentUser} isAdmin={isAdmin} refreshCounter={refreshCounter} />}
          {activeTab === 'inventory' && <InventoryManagement currentUser={currentUser} isAdmin={isAdmin} refreshCounter={refreshCounter} />}
          {activeTab === 'expenses' && <ExpenseManagement currentUser={currentUser} isAdmin={isAdmin} refreshCounter={refreshCounter} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Components ---

function FinancialReports({ currentUser, isAdmin, refreshCounter }: { currentUser: any, isAdmin: boolean, refreshCounter?: number }) {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchReport = async () => {
    setLoading(true);
    const query = dateRange.start && dateRange.end ? `?startDate=${dateRange.start}&endDate=${dateRange.end}` : '';
    const res = await fetch(`/api/reports/financial${query}`, {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [refreshCounter]);

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFont("Inter", "normal");
    doc.text("التقرير المالي - نظام ثقة", 105, 20, { align: "center" });
    
    const data = [
      ["إجمالي المبيعات", `${report.totalSales} ر.س`],
      ["إجمالي النفقات", `${report.totalExpenses} ر.س`],
      ["إجمالي الديون", `${report.totalDebts} ر.س`],
      ["صافي الربح", `${report.netProfit} ر.س`],
    ];

    (doc as any).autoTable({
      head: [['البند', 'القيمة']],
      body: data,
      startY: 30,
      theme: 'grid',
      styles: { font: 'Inter', halign: 'right' }
    });

    doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    if (!report) return;
    const ws = XLSX.utils.json_to_sheet([
      { البند: "إجمالي المبيعات", القيمة: report.totalSales },
      { البند: "إجمالي النفقات", القيمة: report.totalExpenses },
      { البند: "إجمالي الديون", القيمة: report.totalDebts },
      { البند: "صافي الربح", القيمة: report.netProfit },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
    XLSX.writeFile(wb, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">من تاريخ</label>
          <input 
            type="date" 
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="input-field py-2" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">إلى تاريخ</label>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="input-field py-2" 
          />
        </div>
        <button onClick={fetchReport} className="btn-primary py-2 px-6">تحديث</button>
        <div className="flex-1"></div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
            <Download size={18} /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-[#00BFFF]/10 text-[#00BFFF] rounded-xl font-bold hover:bg-[#00BFFF]/20 transition-colors">
            <Download size={18} /> Excel
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'إجمالي المبيعات', value: report?.totalSales, icon: <TrendingUp size={24} />, color: '#00BFFF' },
          { title: 'إجمالي النفقات', value: report?.totalExpenses, icon: <TrendingDown size={24} />, color: '#ef4444' },
          { title: 'إجمالي الديون', value: report?.totalDebts, icon: <CreditCard size={24} />, color: '#f59e0b' },
          { title: 'صافي الربح', value: report?.netProfit, icon: <DollarSign size={24} />, color: '#00BFFF' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/5 shadow-2xl">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="text-sm font-bold text-slate-500">{stat.title}</div>
            <div className="text-2xl font-black text-white mt-1">{stat.value?.toLocaleString()} <span className="text-xs font-normal">ر.س</span></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/5 shadow-2xl h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
            <BarChartIcon size={20} className="text-[#00BFFF]" />
            توزيع المبيعات حسب الخدمة
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report?.salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                cursor={{ fill: '#f8fafc', opacity: 0.1 }}
              />
              <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 dark:text-white">
            <PieChartIcon size={20} className="text-rose-600 dark:text-rose-400" />
            توزيع النفقات حسب التصنيف
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={report?.expensesByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="total"
                nameKey="category"
              >
                {report?.expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DebtManagement({ currentUser, isAdmin, refreshCounter }: { currentUser: any, isAdmin: boolean, refreshCounter?: number }) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    type: 'debtor',
    person_name: '',
    amount: '',
    due_date: '',
    description: ''
  });

  const fetchDebts = async () => {
    const res = await fetch('/api/debts', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setDebts(data);
    setLoading(false);
  };

  useEffect(() => { fetchDebts(); }, [refreshCounter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/debts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentUser?.id?.toString() || ''
      },
      body: JSON.stringify(formData)
    });
    setShowAdd(false);
    setFormData({ type: 'debtor', person_name: '', amount: '', due_date: '', description: '' });
    fetchDebts();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/debts/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentUser?.id?.toString() || ''
      },
      body: JSON.stringify({ status })
    });
    fetchDebts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">إدارة الديون</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 py-2 px-6"
          >
            <Plus size={18} /> إضافة دين جديد
          </button>
        )}
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">نوع الدين</label>
              <select 
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="input-field py-2"
              >
                <option value="debtor">مدين (لنا)</option>
                <option value="creditor">دائن (علينا)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">اسم الشخص / الجهة</label>
              <input 
                required
                value={formData.person_name}
                onChange={e => setFormData(prev => ({ ...prev, person_name: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">المبلغ</label>
              <input 
                required
                type="number"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">تاريخ الاستحقاق</label>
              <input 
                required
                type="date"
                value={formData.due_date}
                onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">الوصف</label>
              <input 
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-6">إلغاء</button>
              <button type="submit" className="btn-primary py-2 px-6">حفظ</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="table-container">
        <table className="w-full text-right">
          <thead>
            <tr>
              <th>النوع</th>
              <th>الاسم</th>
              <th>المبلغ</th>
              <th>تاريخ الاستحقاق</th>
              <th>الحالة</th>
              <th className="text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : debts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">لا توجد ديون مسجلة</td></tr>
            ) : debts.map(debt => (
              <tr key={debt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${debt.type === 'debtor' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                    {debt.type === 'debtor' ? 'مدين (لنا)' : 'دائن (علينا)'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold">{debt.person_name}</td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">{debt.amount} ر.س</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {debt.due_date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    debt.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    debt.status === 'late' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {debt.status === 'paid' ? 'مدفوع' : debt.status === 'late' ? 'متأخر' : 'غير مدفوع'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {debt.status !== 'paid' && (
                      <button 
                        onClick={() => updateStatus(debt.id, 'paid')}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                        title="تم السداد"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {isAdmin && (
                      <button className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
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

function InventoryManagement({ currentUser, isAdmin, refreshCounter }: { currentUser: any, isAdmin: boolean, refreshCounter?: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
    type: 'regular',
    moaqeb_name: '',
    service_name: ''
  });

  const fetchProducts = async () => {
    const res = await fetch('/api/products', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [refreshCounter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentUser?.id?.toString() || ''
      },
      body: JSON.stringify(formData)
    });
    setShowAdd(false);
    setFormData({ name: '', quantity: '', price: '', type: 'regular', moaqeb_name: '', service_name: '' });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">الجرد والمخزون</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 py-2 px-6"
          >
            <Plus size={18} /> إضافة منتج / خدمة
          </button>
        )}
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">نوع المنتج</label>
              <select 
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="input-field py-2"
              >
                <option value="regular">منتج عادي</option>
                <option value="establishment">منتج مؤسسات (مرتبط بالعمالة)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">اسم المنتج / الخدمة</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            {formData.type === 'regular' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">الكمية</label>
                <input 
                  required
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="input-field py-2"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">السعر</label>
              <input 
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">اسم المعقب</label>
              <input 
                value={formData.moaqeb_name}
                onChange={e => setFormData(prev => ({ ...prev, moaqeb_name: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">اسم الخدمة</label>
              <input 
                value={formData.service_name}
                onChange={e => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-6">إلغاء</button>
              <button type="submit" className="btn-primary py-2 px-6">حفظ</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center p-12 text-slate-400">لا توجد منتجات مسجلة</div>
        ) : products.map(product => (
          <div key={product.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${product.type === 'establishment' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                {product.type === 'establishment' ? 'منتج مؤسسات' : 'منتج عادي'}
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-black">{product.price} <span className="text-[10px]">ر.س</span></div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{product.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 dark:text-slate-500">الكمية المتاحة:</span>
                <span className={`font-bold ${product.quantity < 5 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{product.quantity}</span>
              </div>
              {product.moaqeb_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 dark:text-slate-500">المعقب:</span>
                  <span className="text-slate-900 dark:text-white">{product.moaqeb_name}</span>
                </div>
              )}
              {product.service_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 dark:text-slate-500">الخدمة:</span>
                  <span className="text-slate-900 dark:text-white">{product.service_name}</span>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">تعديل</button>
                <button className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"><Trash2 size={18} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesManagement({ currentUser, isAdmin, refreshCounter }: { currentUser: any, isAdmin: boolean, refreshCounter?: number }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    const res = await fetch('/api/sales', {
      headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
    });
    const data = await res.json();
    setSales(data);
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, [refreshCounter]);

  const printInvoice = (sale: any) => {
    const doc = new jsPDF();
    doc.setFont("Inter", "normal");
    doc.text("فاتورة ضريبية مبسطة", 105, 20, { align: "center" });
    doc.text("نظام ثقة لإدارة الخدمات", 105, 30, { align: "center" });
    
    doc.line(20, 40, 190, 40);
    
    doc.text(`رقم الفاتورة: INV-${sale.id}`, 190, 50, { align: "right" });
    doc.text(`التاريخ: ${sale.date || format(new Date(), 'yyyy-MM-dd')}`, 190, 60, { align: "right" });
    doc.text(`العميل: ${sale.client}`, 190, 70, { align: "right" });
    
    const data = [
      [sale.price + " ر.س", "1", sale.service, "1"]
    ];

    (doc as any).autoTable({
      head: [['الإجمالي', 'الكمية', 'الخدمة', 'م']],
      body: data,
      startY: 80,
      theme: 'grid',
      styles: { font: 'Inter', halign: 'right' }
    });

    doc.text(`الإجمالي النهائي: ${sale.price} ر.س`, 20, (doc as any).lastAutoTable.finalY + 20);
    
    doc.save(`invoice-${sale.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="table-container">
        <table className="w-full text-right">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الخدمة</th>
              <th>العميل</th>
              <th>المبلغ</th>
              <th className="text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا توجد مبيعات مسجلة</td></tr>
            ) : sales.map(sale => (
              <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{sale.date || '---'}</td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold">{sale.service}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{sale.client}</td>
                <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-black">{sale.price} ر.س</td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => printInvoice(sale)}
                    className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors"
                    title="طباعة الفاتورة"
                  >
                    <Printer size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpenseManagement({ currentUser, isAdmin, refreshCounter }: { currentUser: any, isAdmin: boolean, refreshCounter?: number }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    const [expRes, catRes] = await Promise.all([
      fetch('/api/expenses', {
        headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
      }),
      fetch('/api/expense-categories', {
        headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
      })
    ]);
    setExpenses(await expRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [refreshCounter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentUser?.id?.toString() || ''
      },
      body: JSON.stringify(formData)
    });
    setShowAdd(false);
    setFormData({ title: '', amount: '', category_id: '', date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">إدارة النفقات</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 py-2 px-6 bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none"
          >
            <Plus size={18} /> إضافة مصروف جديد
          </button>
        )}
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">التاريخ</label>
              <input 
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">المصروف</label>
              <input 
                required
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">التصنيف</label>
              <select 
                required
                value={formData.category_id}
                onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="input-field py-2"
              >
                <option value="">اختر التصنيف</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">المبلغ</label>
              <input 
                required
                type="number"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="input-field py-2"
              />
            </div>
            <div className="lg:col-span-4 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary py-2 px-6">إلغاء</button>
              <button type="submit" className="btn-primary py-2 px-6 bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none">حفظ</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="table-container">
        <table className="w-full text-right">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المصروف</th>
              <th>التصنيف</th>
              <th>المبلغ</th>
              {isAdmin && <th className="text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا توجد مصروفات مسجلة</td></tr>
            ) : expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{expense.date}</td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold">{expense.title}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">
                    {expense.category_name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-rose-600 dark:text-rose-400 font-black">{expense.amount} ر.س</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
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
