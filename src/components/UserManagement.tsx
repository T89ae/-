import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Search,
  Key
} from 'lucide-react';

import ConfirmModal from './ConfirmModal';

export default function UserManagement({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Confirm Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(1);
  const [password, setPassword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
        }),
        fetch('/api/admin/roles', {
          headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
        })
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFullName(user.full_name);
    setRoleId(user.role_id.toString());
    setIsActive(user.is_active);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!fullName || !roleId) return;
    
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({
          full_name: fullName,
          role_id: parseInt(roleId),
          is_active: isActive,
          password: password || undefined
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDelete = (id: number) => {
    setUserToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/admin/users/${userToDelete}`, { 
        method: 'DELETE',
        headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">إدارة المستخدمين</h2>
          <p className="text-slate-500">التحكم في حسابات الموظفين والمديرين وصلاحياتهم</p>
        </div>
        
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="بحث بالاسم أو رقم الهوية..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-80 pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المستخدم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">رقم الهوية</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الدور</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-emerald-500" size={32} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    لا يوجد مستخدمين مطابقين للبحث
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        user.role_name === 'super_admin' ? 'bg-rose-100 text-rose-600' : 
                        user.role_name === 'admin' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      user.role_name === 'super_admin' ? 'bg-rose-50 text-rose-600' : 
                      user.role_name === 'admin' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {user.role_name === 'super_admin' ? 'مدير عام' : 
                       user.role_name === 'admin' ? 'مدير' : 'موظف'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.is_active ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                          <CheckCircle2 size={14} /> نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-600 text-xs font-bold">
                          <XCircle size={14} /> معطل
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <UserPlus size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">تعديل بيانات المستخدم</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 mr-1">الاسم الكامل</label>
                    <input 
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 mr-1">الدور / الصلاحية</label>
                    <select 
                      value={roleId}
                      onChange={e => setRoleId(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.role_name === 'super_admin' ? 'مدير عام' : 
                           role.role_name === 'admin' ? 'مدير' : 'موظف'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 mr-1 flex items-center gap-2">
                      <Key size={14} /> تغيير كلمة المرور (اختياري)
                    </label>
                    <input 
                      type="password"
                      placeholder="اتركه فارغاً لعدم التغيير"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-700">حالة الحساب:</span>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={isActive === 1} 
                          onChange={() => setIsActive(1)}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span className="text-sm font-medium">نشط</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={isActive === 0} 
                          onChange={() => setIsActive(0)}
                          className="w-4 h-4 text-rose-600"
                        />
                        <span className="text-sm font-medium">معطل</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleUpdate}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                  >
                    حفظ التغييرات
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف مستخدم"
        message="هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
      />
    </div>
  );
}
