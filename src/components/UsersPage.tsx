import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Trash2, Edit2, Check, X, 
  AlertCircle, Loader2, Key, Mail, User as UserIcon,
  ShieldCheck, ShieldAlert, Lock, Unlock, Settings,
  Eye, EyeOff, FileText, DollarSign, Users as UsersIcon,
  Briefcase, TrendingUp, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'user';
  permissions: string[];
  last_login: string | null;
  created_at: string;
}

interface UsersPageProps {
  token: string;
  currentUser: User;
}

const ALL_PERMISSIONS = [
  { id: 'manage_users', label: 'إدارة المستخدمين', icon: UsersIcon, category: 'النظام' },
  { id: 'view_reports', label: 'عرض التقارير', icon: TrendingUp, category: 'البيانات' },
  { id: 'manage_sales', label: 'إدارة المبيعات', icon: DollarSign, category: 'البيانات' },
  { id: 'manage_expenses', label: 'إدارة المصاريف', icon: Briefcase, category: 'البيانات' },
  { id: 'manage_workers', label: 'إدارة العمال', icon: Briefcase, category: 'البيانات' },
  { id: 'manage_sponsors', label: 'إدارة الكفلاء', icon: Briefcase, category: 'البيانات' },
  { id: 'manage_clients', label: 'إدارة العملاء', icon: UsersIcon, category: 'البيانات' },
  { id: 'manage_files', label: 'إدارة الملفات', icon: FileText, category: 'البيانات' },
  { id: 'sensitive_ops', label: 'عمليات حساسة (حذف نهائي)', icon: AlertTriangle, category: 'النظام' },
];

export const UsersPage: React.FC<UsersPageProps> = ({ token, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    permissions: [] as string[]
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('فشل تحميل قائمة المستخدمين');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', role: 'user', permissions: [] });
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'فشل حفظ المستخدم');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        setError('فشل حذف المستخدم');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-500 mt-1">إدارة حسابات الفريق وصلاحيات الوصول</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', email: '', password: '', role: 'user', permissions: [] });
            setShowAddModal(true);
          }}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-900 transition-all font-bold"
        >
          <UserPlus className="w-5 h-5" />
          إضافة مستخدم جديد
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-bold text-gray-600">المستخدم</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">الدور</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">آخر ظهور</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ الإنشاء</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'owner' ? 'bg-purple-50 text-purple-600' :
                    user.role === 'admin' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'owner' ? 'مالك كامل الصلاحيات' : user.role === 'admin' ? 'مدير' : 'مستخدم'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleString('ar-SA') : 'لم يسجل دخول'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ar-SA')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (user.id === 1095972897 && currentUser.id !== 1095972897) {
                          alert('لا يمكن تعديل حساب CEO');
                          return;
                        }
                        setEditingUser(user);
                        setFormData({
                          username: user.username,
                          email: user.email,
                          password: '',
                          role: user.role as any,
                          permissions: user.permissions
                        });
                        setShowAddModal(true);
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        user.id === 1095972897 && currentUser.id !== 1095972897
                          ? 'text-gray-200 cursor-not-allowed'
                          : 'text-gray-400 hover:text-black hover:bg-white'
                      }`}
                      title="تعديل"
                      disabled={user.id === 1095972897 && currentUser.id !== 1095972897}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {user.role !== 'owner' && user.id !== 1095972897 && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">اسم المستخدم</label>
                    <div className="relative">
                      <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all ${
                          editingUser?.id === 1095972897 ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="أدخل اسم المستخدم"
                        required
                        disabled={editingUser?.id === 1095972897}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        placeholder="أدخل البريد الإلكتروني"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">
                      {editingUser ? 'كلمة المرور (اتركها فارغة إذا لم ترغب في التغيير)' : 'كلمة المرور'}
                    </label>
                    <div className="relative">
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                        placeholder="أدخل كلمة المرور"
                        required={!editingUser}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">الدور</label>
                    <div className="relative">
                      <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none bg-white"
                        disabled={editingUser?.role === 'owner'}
                      >
                        <option value="user">مستخدم عادي</option>
                        <option value="admin">مدير</option>
                        {editingUser?.role === 'owner' && <option value="owner">مالك كامل الصلاحيات</option>}
                      </select>
                    </div>
                  </div>
                </div>

                {(formData.role as string) !== 'owner' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-900">الصلاحيات المخصصة</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, permissions: ALL_PERMISSIONS.map(p => p.id) })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        تحديد الكل
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALL_PERMISSIONS.map((perm) => (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-right ${
                            formData.permissions.includes(perm.id)
                              ? 'bg-black text-white border-black'
                              : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <perm.icon className={`w-5 h-5 ${formData.permissions.includes(perm.id) ? 'text-white' : 'text-gray-400'}`} />
                          <div className="flex-1">
                            <div className="text-sm font-bold">{perm.label}</div>
                            <div className={`text-[10px] ${formData.permissions.includes(perm.id) ? 'text-white/70' : 'text-gray-400'}`}>
                              {perm.category}
                            </div>
                          </div>
                          {formData.permissions.includes(perm.id) && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={loading}
                  className="bg-black text-white px-8 py-2 rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  حفظ المستخدم
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
