import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  CheckSquare,
  Clock, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Calendar,
  User,
  MoreVertical,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'late';
  created_at: string;
  completed_at?: string;
}

export default function TasksPage({ currentUser, refreshCounter, token }: { currentUser: any, refreshCounter?: number, token: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    late: 0,
    pending: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    due_time: '12:00',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    fetchTasks();
  }, [refreshCounter]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': currentUser?.id?.toString() || '' 
        }
      });
      const data = await response.json();
      setTasks(data);
      calculateStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const calculateStats = (taskList: Task[]) => {
    const today = new Date().toISOString().split('T')[0];
    const newStats = taskList.reduce((acc, task) => {
      acc.total++;
      if (task.status === 'completed') acc.completed++;
      else if (task.status === 'late' || (task.due_date < today && task.status === 'pending')) acc.late++;
      else acc.pending++;
      return acc;
    }, { total: 0, completed: 0, late: 0, pending: 0 });
    setStats(newStats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingTask ? 'PUT' : 'POST';
    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString()
        },
        body: JSON.stringify({
          ...formData,
          due_date: `${formData.due_date}T${formData.due_time}`
        })
      });

      if (response.ok) {
        setShowForm(false);
        setEditingTask(null);
        setFormData({
          title: '',
          description: '',
          assigned_to: '',
          due_date: '',
          due_time: '12:00',
          priority: 'medium'
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: newStatus })
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    setTaskToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await fetch(`/api/tasks/${taskToDelete}`, { method: 'DELETE' });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.assigned_to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'low': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (status === 'completed') {
      return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">منجزة</span>;
    }
    if (status === 'late' || dueDate < today) {
      return <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">متأخرة</span>;
    }
    return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">قيد التنفيذ</span>;
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">إجمالي المهام</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">المهام المنجزة</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.completed}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">المهام المتأخرة</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.late}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">قيد التنفيذ</p>
              <h3 className="text-2xl font-black dark:text-white">{stats.pending}</h3>
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
              placeholder="ابحث عن مهمة أو مسؤول..."
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
            <option value="all">كل المهام</option>
            <option value="pending">قيد التنفيذ</option>
            <option value="completed">المنجزة</option>
            <option value="late">المتأخرة</option>
          </select>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary w-full md:w-auto flex items-center gap-2 justify-center"
        >
          <Plus size={20} />
          إضافة مهمة جديدة
        </button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-bold text-slate-400">رقم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">عنوان المهمة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">المسؤول</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">تاريخ التنفيذ</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الأولوية</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => (
                <tr 
                  key={task.id}
                  className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                    task.status === 'completed' ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : 
                    (task.status === 'late' || task.due_date < new Date().toISOString().split('T')[0]) ? 'bg-rose-50/30 dark:bg-rose-900/5' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <User size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{task.assigned_to}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(task.due_date).toLocaleDateString('ar-SA')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(task.status, task.due_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {task.status !== 'completed' && (
                        <button 
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                          title="منجز"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditingTask(task);
                          setFormData({
                            title: task.title,
                            description: task.description,
                            assigned_to: task.assigned_to,
                            due_date: task.due_date.split('T')[0],
                            due_time: task.due_date.split('T')[1]?.substring(0, 5) || '12:00',
                            priority: task.priority
                          });
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    لا توجد مهام مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Form Modal */}
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
                  {editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
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
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">عنوان المهمة</label>
                    <input 
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="مثلاً: تجديد إقامة عامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">المسؤول عن المهمة</label>
                    <input 
                      required
                      type="text"
                      value={formData.assigned_to}
                      onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="اسم الموظف"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">وصف المهمة</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white resize-none"
                    placeholder="تفاصيل إضافية عن المهمة..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">تاريخ التنفيذ</label>
                    <input 
                      required
                      type="date"
                      value={formData.due_date}
                      onChange={e => setFormData({...formData, due_date: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">وقت التنفيذ</label>
                    <input 
                      required
                      type="time"
                      value={formData.due_time}
                      onChange={e => setFormData({...formData, due_time: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">الأولوية</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({...formData, priority: e.target.value as any})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                    >
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                  >
                    {editingTask ? 'تحديث المهمة' : 'حفظ المهمة'}
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
        title="حذف المهمة"
        message="هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
}
