import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCcw, 
  Trash2, 
  Edit2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  FileText,
  Eye,
  ArrowLeft,
  Loader2,
  Upload,
  Download,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientFile {
  id: number;
  file_name: string;
  file_type: string;
  upload_date: string;
}

interface Client {
  id: number;
  name: string;
  national_id: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  notes: string;
  created_at: string;
}

export default function ClientsPage({ currentUser, refreshCounter }: { currentUser: any, refreshCounter?: number }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    phone: '',
    email: '',
    city: '',
    service: '',
    notes: ''
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientFiles = async (clientId: number) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/files`);
      const data = await response.json();
      setClientFiles(data);
    } catch (error) {
      console.error('Error fetching client files:', error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [refreshCounter]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientFiles(selectedClient.id);
    }
  }, [selectedClient]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedClient) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch(`/api/clients/${selectedClient.id}/files/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        fetchClientFiles(selectedClient.id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
      const response = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (response.ok && selectedClient) {
        fetchClientFiles(selectedClient.id);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingClient ? 'PUT' : 'POST';
    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingClient(null);
        setFormData({
          name: '',
          national_id: '',
          phone: '',
          email: '',
          city: '',
          service: '',
          notes: ''
        });
        fetchClients();
      }
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    try {
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const filteredClients = clients.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    c.national_id.includes(searchTerm) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ابحث عن عميل بالاسم أو الهوية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          <button 
            onClick={fetchClients}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="تحديث البيانات"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <button 
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: '', national_id: '', phone: '', email: '', city: '', service: '', notes: '' });
            setShowForm(true);
          }}
          className="btn-primary w-full md:w-auto flex items-center gap-2 justify-center"
        >
          <Plus size={20} />
          إضافة عميل جديد
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-bold text-slate-400">رقم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الاسم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">رقم الهوية</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الجوال</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الخدمة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">تاريخ الإضافة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr 
                  key={client.id}
                  className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">{client.national_id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-mono">{client.phone}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">
                      {client.service}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(client.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedClient(client)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                        title="عرض الملف الكامل"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingClient(client);
                          setFormData({
                            name: client.name,
                            national_id: client.national_id,
                            phone: client.phone,
                            email: client.email,
                            city: client.city,
                            service: client.service,
                            notes: client.notes
                          });
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="تعديل"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    لا يوجد عملاء مسجلون
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Form Modal */}
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
                  {editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
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
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">اسم العميل</label>
                    <input 
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="الاسم الكامل"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">رقم الهوية</label>
                    <input 
                      required
                      type="text"
                      value={formData.national_id}
                      onChange={e => setFormData({...formData, national_id: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white font-mono"
                      placeholder="10XXXXXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">رقم الجوال</label>
                    <input 
                      required
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white font-mono"
                      placeholder="05XXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">البريد الإلكتروني</label>
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="example@mail.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">المدينة</label>
                    <input 
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="اسم المدينة"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">الخدمة المطلوبة</label>
                    <input 
                      type="text"
                      value={formData.service}
                      onChange={e => setFormData({...formData, service: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      placeholder="نوع الخدمة"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-1">ملاحظات إضافية</label>
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white resize-none"
                    placeholder="أي ملاحظات إضافية عن العميل..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                  >
                    {editingClient ? 'تحديث البيانات' : 'حفظ العميل'}
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

      {/* Client Profile Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-600">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                    <User size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedClient.name}</h2>
                    <p className="text-emerald-100">عميل مسجل منذ {new Date(selectedClient.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">رقم الهوية</p>
                      <p className="font-bold dark:text-white font-mono">{selectedClient.national_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">رقم الجوال</p>
                      <p className="font-bold dark:text-white font-mono">{selectedClient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">البريد الإلكتروني</p>
                      <p className="font-bold dark:text-white">{selectedClient.email || 'غير متوفر'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">المدينة</p>
                      <p className="font-bold dark:text-white">{selectedClient.city || 'غير متوفر'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">الخدمة المطلوبة</p>
                      <p className="font-bold dark:text-white">{selectedClient.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                      <Edit2 size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">ملاحظات</p>
                      <p className="font-bold dark:text-white">{selectedClient.notes || 'لا توجد ملاحظات'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black dark:text-white flex items-center gap-2">
                    <FileText className="text-[#00BFFF]" size={20} />
                    وثائق العميل
                  </h3>
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#00BFFF] text-white rounded-xl text-sm font-bold hover:bg-[#0099CC] transition-all">
                    <Upload size={16} />
                    رفع وثيقة
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {uploading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="animate-spin text-[#00BFFF]" />
                    </div>
                  )}
                  {clientFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold dark:text-white">{file.file_name}</p>
                          <p className="text-xs text-slate-400">{new Date(file.upload_date).toLocaleDateString('ar-SA')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`/api/files/download/${file.id}`}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                          title="تحميل"
                        >
                          <Download size={18} />
                        </a>
                        <button 
                          onClick={() => deleteFile(file.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {clientFiles.length === 0 && !uploading && (
                    <p className="text-center py-8 text-slate-400 text-sm">لا توجد وثائق مرفوعة لهذا العميل</p>
                  )}
                </div>

                <div className="flex justify-end mt-8">
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="px-8 py-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
