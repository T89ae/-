import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Search, 
  RefreshCcw, 
  Trash2, 
  Download, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Plus,
  FileSearch,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileRecord {
  id: number;
  file_name: string;
  file_type: string;
  upload_date: string;
  analysis_status: 'processing' | 'completed' | 'failed';
  extracted_data: string;
}

import { analyzeFileWithAI } from '../services/geminiService';

export default function FileManagementPage({ currentUser, refreshCounter, token }: { currentUser: any, refreshCounter?: number, token: string }) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [previewFile, setPreviewFile] = useState<{ id: number, name: string, content: string, type: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': currentUser?.id?.toString() || '' 
        }
      });
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshCounter]);

  const analyzeFile = async (fileId: number) => {
    try {
      const res = await fetch(`/api/files/content/${fileId}`);
      const { type, content, mimeType } = await res.json();
      
      let extractedData;
      if (type === 'excel') {
        extractedData = await analyzeFileWithAI(`Excel Data: ${content}`, 'excel');
      } else {
        extractedData = await analyzeFileWithAI(content, mimeType);
      }

      await fetch('/api/files/save-extracted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, data: extractedData, userId: currentUser?.id })
      });

      fetchFiles();
    } catch (error) {
      console.error('Analysis Error:', error);
      // Update status to failed
      fetchFiles();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id.toString()
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          handlePreview(data.id, file.name);
        }
        fetchFiles();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleReanalyze = async (id: number) => {
    try {
      const response = await fetch(`/api/files/reanalyze/${id}`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.id.toString()
        }
      });
      if (response.ok) {
        analyzeFile(id);
        fetchFiles();
      }
    } catch (error) {
      console.error('Error reanalyzing file:', error);
    }
  };

  const handlePreview = async (id: number, name: string) => {
    try {
      setPreviewLoading(true);
      const res = await fetch(`/api/files/content/${id}`);
      const data = await res.json();
      setPreviewFile({ id, name, content: data.content, type: data.type });
    } catch (error) {
      console.error('Preview Error:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = (id: number, fileName: string) => {
    window.open(`/api/files/download/${id}`, '_blank');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
      const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const filteredFiles = files.filter(f => 
    f.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'failed': return <AlertCircle className="text-rose-500" size={18} />;
      default: return <Clock className="text-amber-500 animate-pulse" size={18} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'تم التحليل';
      case 'failed': return 'فشل التحليل';
      default: return 'قيد المعالجة';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ابحث عن ملف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          <button 
            onClick={fetchFiles}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="تحديث البيانات"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <label className="flex-1 md:flex-none">
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload}
              accept=".xls,.xlsx,.doc,.docx,.pdf,image/*"
            />
            <div className={`btn-primary flex items-center gap-2 justify-center cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
              رفع ملف جديد
            </div>
          </label>
        </div>
      </div>

      {/* Files Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-bold text-slate-400">رقم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">اسم الملف</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">النوع</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">تاريخ الرفع</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-400">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, index) => (
                <tr 
                  key={file.id}
                  className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                        <FileText size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{file.file_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 uppercase">{file.file_type.replace('.', '')}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {file.upload_date ? new Date(file.upload_date).toLocaleString('ar-SA') : '---'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.analysis_status)}
                      <span className="text-xs font-bold dark:text-slate-300">{getStatusText(file.analysis_status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePreview(file.id, file.file_name)}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                        title="معاينة الملف"
                      >
                        <FileSearch size={18} />
                      </button>
                      <button 
                        onClick={() => setSelectedFile(file)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                        title="عرض البيانات المستخرجة"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleReanalyze(file.id)}
                        className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors"
                        title="إعادة التحليل"
                      >
                        <RefreshCcw size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownload(file.id, file.file_name)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                        title="تحميل الملف"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                        title="حذف الملف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFiles.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    لا توجد ملفات مرفوعة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extracted Data Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black dark:text-white">معاينة الملف</h2>
                  <p className="text-sm text-slate-400 mt-1">{previewFile.name}</p>
                </div>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 font-mono text-sm whitespace-pre-wrap dark:text-slate-300">
                  {previewFile.content || 'لا يمكن عرض محتوى هذا الملف مباشرة.'}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end gap-4">
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="px-8 py-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800"
                >
                  إغلاق
                </button>
                <button 
                  onClick={() => {
                    analyzeFile(previewFile.id);
                    setPreviewFile(null);
                  }}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center gap-2"
                >
                  <RefreshCcw size={18} />
                  بدء التحليل بالذكاء الاصطناعي
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extracted Data Modal */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFile(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black dark:text-white">البيانات المستخرجة</h2>
                  <p className="text-sm text-slate-400 mt-1">{selectedFile.file_name}</p>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                {selectedFile.extracted_data ? (
                  (() => {
                    const data = JSON.parse(selectedFile.extracted_data);
                    return (
                      <div className="space-y-8">
                        {data.classification && (
                          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">تصنيف المستند</p>
                            <p className="text-lg font-black text-indigo-900 dark:text-indigo-100">
                              {data.classification === 'identity' ? 'وثيقة هوية' :
                               data.classification === 'contract' ? 'عقد' :
                               data.classification === 'invoice' ? 'فاتورة' :
                               data.classification === 'government_form' ? 'نموذج حكومي' :
                               data.classification}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                        {/* Clients Section */}
                        {data.clients?.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                              <CheckCircle2 size={18} />
                              العملاء المستخرجون ({data.clients.length})
                            </h3>
                            <div className="space-y-2">
                              {data.clients.map((c: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                                  <p className="font-bold dark:text-white">{c.name}</p>
                                  <p className="text-xs text-slate-400">{c.phone} | {c.national_id}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sales Section */}
                        {data.sales?.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-bold text-[#00BFFF] flex items-center gap-2">
                              <CheckCircle2 size={18} />
                              المبيعات المستخرجة ({data.sales.length})
                            </h3>
                            <div className="space-y-2">
                              {data.sales.map((s: any, i: number) => (
                                <div key={i} className="p-3 bg-white/5 rounded-xl text-sm border border-white/5">
                                  <p className="font-bold text-white">{s.service_name}</p>
                                  <p className="text-xs text-slate-400">{s.sale_price} ر.س | {s.supplier_name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Broker Dues Section */}
                        {data.broker_dues?.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                              <CheckCircle2 size={18} />
                              مستحقات الوسطاء ({data.broker_dues.length})
                            </h3>
                            <div className="space-y-2">
                              {data.broker_dues.map((b: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                                  <p className="font-bold dark:text-white">{b.broker_name}</p>
                                  <p className="text-xs text-slate-400">{b.total_amount} ر.س | {b.service_name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Accounting Section */}
                        {data.accounting?.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                              <CheckCircle2 size={18} />
                              العمليات المحاسبية ({data.accounting.length})
                            </h3>
                            <div className="space-y-2">
                              {data.accounting.map((a: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                                  <p className="font-bold dark:text-white">{a.title}</p>
                                  <p className={`text-xs ${a.type === 'income' ? 'text-[#00BFFF]' : 'text-rose-500'}`}>
                                    {a.amount} ر.س | {a.type === 'income' ? 'دخل' : 'مصروف'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Workers Section */}
                        {data.workers?.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                              <CheckCircle2 size={18} />
                              العمال المستخرجون ({data.workers.length})
                            </h3>
                            <div className="space-y-2">
                              {data.workers.map((w: any, i: number) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm">
                                  <p className="font-bold dark:text-white">{w.name}</p>
                                  <p className="text-xs text-slate-400">{w.job} | {w.sponsor}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    {selectedFile.analysis_status === 'processing' ? 'جاري تحليل الملف...' : 'لا توجد بيانات مستخرجة'}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="px-8 py-3 bg-[#1a1a1a] text-slate-300 rounded-2xl font-bold hover:bg-white/5 transition-all border border-white/5"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
