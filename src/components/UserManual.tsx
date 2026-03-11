import { useState, useEffect } from 'react';
import { generateManualContent } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Loader2, Search } from 'lucide-react';
import { SECTIONS } from '../constants';

export default function UserManual() {
  const [selectedSection, setSelectedSection] = useState(SECTIONS[0].title);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const text = await generateManualContent(selectedSection);
        setContent(text || 'لا يمكن العثور على محتوى حالياً.');
      } catch (error) {
        console.error(error);
        setContent('حدث خطأ أثناء تحميل الدليل.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [selectedSection]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-bottom border-slate-100">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="بحث في الدليل..." 
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.title)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right text-sm transition-all ${
                selectedSection === section.title 
                ? 'bg-emerald-50 text-emerald-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={selectedSection === section.title ? 'text-emerald-500' : 'text-slate-400'}>
                {section.icon}
              </span>
              {section.title}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">{selectedSection}</h2>
          <p className="text-sm text-slate-500 mt-1">دليل المستخدم الرسمي لنظام ثقة</p>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <Loader2 className="animate-spin" size={40} />
              <p>جاري توليد الدليل باستخدام الذكاء الاصطناعي...</p>
            </div>
          ) : (
            <div className="markdown-body prose prose-slate max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
