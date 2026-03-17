import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  FileText, 
  DollarSign, 
  Plus, 
  Search,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: number;
  name: string;
  phone: string;
  created_at: string;
}

interface AgentRequest {
  id: number;
  agent_id: number;
  description: string;
  paid_amount: number;
  wholesale_price: number;
  debt: number;
  status: string;
  created_at: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newAgent, setNewAgent] = useState({ name: '', phone: '' });
  const [newRequest, setNewRequest] = useState({
    description: '',
    paid_amount: 0,
    wholesale_price: 0
  });

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (agentId: number) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/requests`);
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchRequests(selectedAgent.id);
    }
  }, [selectedAgent]);

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });
      if (res.ok) {
        fetchAgents();
        setShowAddAgent(false);
        setNewAgent({ name: '', phone: '' });
      }
    } catch (error) {
      console.error('Error adding agent:', error);
    }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    try {
      const res = await fetch('/api/agent-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRequest, agent_id: selectedAgent.id })
      });
      if (res.ok) {
        fetchRequests(selectedAgent.id);
        setShowAddRequest(false);
        setNewRequest({ description: '', paid_amount: 0, wholesale_price: 0 });
      }
    } catch (error) {
      console.error('Error adding request:', error);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm)
  );

  const totalDebt = requests.reduce((acc, curr) => acc + curr.debt, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">الوكلاء والمعقبين</h1>
          <p className="text-slate-500 mt-1">إدارة الوكلاء ومتابعة طلبات الخدمات والديون</p>
        </div>
        <button
          onClick={() => setShowAddAgent(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-200"
        >
          <UserPlus size={20} />
          <span>إضافة وكيل جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Agents List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="بحث عن وكيل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-bottom border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Users size={18} />
                قائمة الوكلاء
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin mx-auto text-emerald-600" size={24} />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا يوجد وكلاء حالياً</div>
              ) : (
                filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedAgent?.id === agent.id ? 'bg-emerald-50 border-r-4 border-emerald-500' : ''}`}
                  >
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{agent.name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Phone size={12} />
                        {agent.phone}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Agent Details & Requests */}
        <div className="lg:col-span-8 space-y-6">
          {selectedAgent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-2">
                    <Wallet size={20} className="text-emerald-600" />
                    <span className="text-sm font-medium">إجمالي الديون</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{totalDebt.toLocaleString()} ريال</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    <span className="text-sm font-medium">عدد الطلبات</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-2">
                    <Clock size={20} className="text-amber-600" />
                    <span className="text-sm font-medium">تاريخ الانضمام</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {new Date(selectedAgent.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              {/* Requests Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-600" />
                    طلبات الخدمة - {selectedAgent.name}
                  </h3>
                  <button
                    onClick={() => setShowAddRequest(true)}
                    className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus size={18} />
                    إضافة طلب جديد
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-semibold">الوصف</th>
                        <th className="px-6 py-4 font-semibold">سعر الجملة</th>
                        <th className="px-6 py-4 font-semibold">المبلغ المدفوع</th>
                        <th className="px-6 py-4 font-semibold">الدين</th>
                        <th className="px-6 py-4 font-semibold">التاريخ</th>
                        <th className="px-6 py-4 font-semibold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{req.description}</td>
                          <td className="px-6 py-4 text-slate-600">{req.wholesale_price} ريال</td>
                          <td className="px-6 py-4 text-emerald-600">{req.paid_amount} ريال</td>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${req.debt > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                              {req.debt} ريال
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">
                            {new Date(req.created_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4">
                            {req.debt === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                <CheckCircle2 size={12} />
                                مسدد
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                <Clock size={12} />
                                معلق
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-12">
              <Users size={64} strokeWidth={1} />
              <p className="text-lg">اختر وكيلاً من القائمة لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Agent Modal */}
      <AnimatePresence>
        {showAddAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">إضافة وكيل جديد</h2>
              <form onSubmit={handleAddAgent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل</label>
                  <input
                    required
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    required
                    type="tel"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                  >
                    حفظ الوكيل
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAgent(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Request Modal */}
      <AnimatePresence>
        {showAddRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">إضافة طلب خدمة جديد</h2>
              <form onSubmit={handleAddRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">وصف الطلب</label>
                  <input
                    required
                    type="text"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">سعر الجملة</label>
                    <input
                      required
                      type="number"
                      value={newRequest.wholesale_price}
                      onChange={(e) => setNewRequest({ ...newRequest, wholesale_price: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ المدفوع</label>
                    <input
                      required
                      type="number"
                      value={newRequest.paid_amount}
                      onChange={(e) => setNewRequest({ ...newRequest, paid_amount: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">الدين المتبقي:</span>
                    <span className="text-xl font-bold text-red-600">
                      {(newRequest.wholesale_price - newRequest.paid_amount).toLocaleString()} ريال
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                  >
                    تسجيل الطلب
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddRequest(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
