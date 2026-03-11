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

export default function AccountingPage({ currentUser }: { currentUser: any }) {
  const [activeTab, setActiveTab] = useState('reports');
  const isAdmin = currentUser?.role === 'admin';

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
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
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
          {activeTab === 'reports' && <FinancialReports isAdmin={isAdmin} />}
          {activeTab === 'sales' && <SalesManagement isAdmin={isAdmin} />}
          {activeTab === 'debts' && <DebtManagement isAdmin={isAdmin} />}
          {activeTab === 'inventory' && <InventoryManagement isAdmin={isAdmin} />}
          {activeTab === 'expenses' && <ExpenseManagement isAdmin={isAdmin} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Components ---

function FinancialReports({ isAdmin }: { isAdmin: boolean }) {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchReport = async () => {
    setLoading(true);
    const query = dateRange.start && dateRange.end ? `?startDate=${dateRange.start}&endDate=${dateRange.end}` : '';
    const res = await fetch(`/api/reports/financial${query}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, []);

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
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2">من تاريخ</label>
          <input 
            type="date" 
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2">إلى تاريخ</label>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" 
          />
        </div>
        <button onClick={fetchReport} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors">تحديث</button>
        <div className="flex-1"></div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors">
            <Download size={18} /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors">
            <Download size={18} /> Excel
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'إجمالي المبيعات', value: report?.totalSales, icon: <TrendingUp size={24} />, color: 'emerald' },
          { title: 'إجمالي النفقات', value: report?.totalExpenses, icon: <TrendingDown size={24} />, color: 'rose' },
          { title: 'إجمالي الديون', value: report?.totalDebts, icon: <CreditCard size={24} />, color: 'amber' },
          { title: 'صافي الربح', value: report?.netProfit, icon: <DollarSign size={24} />, color: 'blue' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <div className="text-sm font-bold text-slate-400">{stat.title}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stat.value?.toLocaleString()} <span className="text-xs font-normal">ر.س</span></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChartIcon size={20} className="text-emerald-600" />
            توزيع المبيعات حسب الخدمة
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report?.salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-rose-600" />
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
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DebtManagement({ isAdmin }: { isAdmin: boolean }) {
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
    const res = await fetch('/api/debts');
    const data = await res.json();
    setDebts(data);
    setLoading(false);
  };

  useEffect(() => { fetchDebts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowAdd(false);
    setFormData({ type: 'debtor', person_name: '', amount: '', due_date: '', description: '' });
    fetchDebts();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/debts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchDebts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">إدارة الديون</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} /> إضافة دين جديد
          </button>
        )}
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">نوع الدين</label>
              <select 
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="debtor">مدين (لنا)</option>
                <option value="creditor">دائن (علينا)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">اسم الشخص / الجهة</label>
              <input 
                required
                value={formData.person_name}
                onChange={e => setFormData(prev => ({ ...prev, person_name: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">المبلغ</label>
              <input 
                required
                type="number"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">تاريخ الاستحقاق</label>
              <input 
                required
                type="date"
                value={formData.due_date}
                onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-2">الوصف</label>
              <input 
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">حفظ</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">النوع</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الاسم</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">المبلغ</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">تاريخ الاستحقاق</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : debts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">لا توجد ديون مسجلة</td></tr>
            ) : debts.map(debt => (
              <tr key={debt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${debt.type === 'debtor' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {debt.type === 'debtor' ? 'مدين (لنا)' : 'دائن (علينا)'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 font-bold">{debt.person_name}</td>
                <td className="px-6 py-4 text-sm text-slate-900">{debt.amount} ر.س</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {debt.due_date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    debt.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                    debt.status === 'late' ? 'bg-rose-100 text-rose-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {debt.status === 'paid' ? 'مدفوع' : debt.status === 'late' ? 'متأخر' : 'غير مدفوع'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {debt.status !== 'paid' && (
                      <button 
                        onClick={() => updateStatus(debt.id, 'paid')}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="تم السداد"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {isAdmin && (
                      <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
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

function InventoryManagement({ isAdmin }: { isAdmin: boolean }) {
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
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowAdd(false);
    setFormData({ name: '', quantity: '', price: '', type: 'regular', moaqeb_name: '', service_name: '' });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">الجرد والمخزون</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} /> إضافة منتج / خدمة
          </button>
        )}
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">نوع المنتج</label>
              <select 
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="regular">منتج عادي</option>
                <option value="establishment">منتج مؤسسات (مرتبط بالعمالة)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">اسم المنتج / الخدمة</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {formData.type === 'regular' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">الكمية</label>
                <input 
                  required
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">السعر</label>
              <input 
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">اسم المعقب</label>
              <input 
                value={formData.moaqeb_name}
                onChange={e => setFormData(prev => ({ ...prev, moaqeb_name: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">اسم الخدمة</label>
              <input 
                value={formData.service_name}
                onChange={e => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">حفظ</button>
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
          <div key={product.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${product.type === 'establishment' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {product.type === 'establishment' ? 'منتج مؤسسات' : 'منتج عادي'}
              </div>
              <div className="text-emerald-600 font-black">{product.price} <span className="text-[10px]">ر.س</span></div>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">{product.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">الكمية المتاحة:</span>
                <span className={`font-bold ${product.quantity < 5 ? 'text-rose-600' : 'text-slate-900'}`}>{product.quantity}</span>
              </div>
              {product.moaqeb_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">المعقب:</span>
                  <span className="text-slate-900">{product.moaqeb_name}</span>
                </div>
              )}
              {product.service_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">الخدمة:</span>
                  <span className="text-slate-900">{product.service_name}</span>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-50">
                <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">تعديل</button>
                <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesManagement({ isAdmin }: { isAdmin: boolean }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    const res = await fetch('/api/sales');
    const data = await res.json();
    setSales(data);
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, []);

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
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">الخدمة</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">العميل</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">المبلغ</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا توجد مبيعات مسجلة</td></tr>
            ) : sales.map(sale => (
              <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500">{sale.date || '---'}</td>
                <td className="px-6 py-4 text-sm text-slate-900 font-bold">{sale.service}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{sale.client}</td>
                <td className="px-6 py-4 text-sm text-emerald-600 font-black">{sale.price} ر.س</td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => printInvoice(sale)}
                    className="p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-600 rounded-xl transition-colors"
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

function ExpenseManagement({ isAdmin }: { isAdmin: boolean }) {
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
      fetch('/api/expenses'),
      fetch('/api/expense-categories')
    ]);
    setExpenses(await expRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setShowAdd(false);
    setFormData({ title: '', amount: '', category_id: '', date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">إدارة النفقات</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-700 transition-colors"
          >
            <Plus size={18} /> إضافة مصروف جديد
          </button>
        )}
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
        >
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">التاريخ</label>
              <input 
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">المصروف</label>
              <input 
                required
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">التصنيف</label>
              <select 
                required
                value={formData.category_id}
                onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">اختر التصنيف</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">المبلغ</label>
              <input 
                required
                type="number"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="lg:col-span-4 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
              <button type="submit" className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold">حفظ</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">المصروف</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">التصنيف</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-600">المبلغ</th>
              {isAdmin && <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا توجد مصروفات مسجلة</td></tr>
            ) : expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-500">{exp.date || '---'}</td>
                <td className="px-6 py-4 text-sm text-slate-900 font-bold">{exp.title}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{exp.category_name}</td>
                <td className="px-6 py-4 text-sm text-rose-600 font-black">{exp.amount} ر.س</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
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
