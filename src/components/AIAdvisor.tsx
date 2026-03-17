import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  BrainCircuit,
  ArrowRight,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AdvisorData {
  highDebts: any[];
  salesTrend: {
    current: number;
    previous: number;
  };
  upcomingFollowups: any[];
}

export default function AIAdvisor({ currentUser }: { currentUser: any }) {
  const [data, setData] = useState<AdvisorData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/advisor-summary');
      const summary = await res.json();
      setData(summary);
    } catch (error) {
      console.error('Error fetching advisor summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-[#00BFFF]" size={40} />
        <p className="text-slate-400 font-bold">جاري تحليل البيانات واستخراج الرؤى...</p>
      </div>
    );
  }

  const profitDiff = (data?.salesTrend.current || 0) - (data?.salesTrend.previous || 0);
  const profitPercent = data?.salesTrend.previous 
    ? ((profitDiff / data.salesTrend.previous) * 100).toFixed(1) 
    : '100';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-[#1a1a1a] dark:to-[#0a0a0a] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00BFFF] blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 blur-[100px] rounded-full" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-[#00BFFF]/10 rounded-3xl flex items-center justify-center border border-[#00BFFF]/20">
            <BrainCircuit className="text-[#00BFFF]" size={40} />
          </div>
          <div className="flex-1 text-center md:text-right">
            <h2 className="text-3xl font-black text-white mb-2">المستشار الذكي</h2>
            <p className="text-slate-300 max-w-2xl">
              أهلاً بك يا {currentUser?.full_name}. لقد قمت بتحليل نشاط المؤسسة خلال الـ 30 يوماً الماضية. إليك أهم الملاحظات التي تتطلب انتباهك.
            </p>
          </div>
          <button 
            onClick={fetchSummary}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all border border-white/10"
          >
            <RefreshCcw size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profit Trend Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">أداء المبيعات</span>
              <div className={`p-2 rounded-lg ${profitDiff >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {profitDiff >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
              {data?.salesTrend.current.toLocaleString()} <span className="text-lg font-normal text-slate-400">ر.س</span>
            </h3>
            <p className="text-sm text-slate-500">إجمالي المبيعات (آخر 30 يوماً)</p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${profitDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {profitDiff >= 0 ? '+' : ''}{profitPercent}%
              </span>
              <span className="text-xs text-slate-400">مقارنة بالشهر السابق</span>
            </div>
          </div>
        </motion.div>

        {/* High Debts Alert */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              تنبيه: ديون مرتفعة تحتاج تحصيل
            </h3>
            <span className="text-xs font-bold text-slate-400">أعلى 5 مبالغ</span>
          </div>

          <div className="space-y-4">
            {data?.highDebts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic">لا توجد ديون مرتفعة حالياً. عمل ممتاز!</div>
            ) : data?.highDebts.map((debt, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-[#00BFFF]/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#00BFFF] transition-colors">{debt.person_name}</p>
                    <p className="text-xs text-slate-500">{debt.description || 'بدون وصف'}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-black text-slate-900 dark:text-white">{debt.amount.toLocaleString()} ر.س</p>
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">غير مدفوع</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Followups */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-white dark:bg-[#1a1a1a] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-[#00BFFF]" size={20} />
              متابعات مستحقة (تجاوزت 25 يوماً)
            </h3>
            <button className="text-xs font-bold text-[#00BFFF] hover:underline">عرض الكل</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.upcomingFollowups.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 italic">جميع المتابعات محدثة.</div>
            ) : data?.upcomingFollowups.map((worker, i) => (
              <div key={i} className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-between group hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-all">
                <div className="mb-4">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">{worker.name}</p>
                  <p className="text-xs text-slate-500">{worker.job}</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="text-[10px] font-bold text-slate-400">
                    تاريخ التسجيل: {worker.registration_date}
                  </div>
                  <button className="p-2 bg-[#00BFFF]/10 text-[#00BFFF] rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Strategic Advice */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-emerald-500 mb-2">نصيحة المستشار الاستراتيجية</h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {profitDiff > 0 
                ? "أداء المبيعات في تحسن ملحوظ. ننصح بالتركيز على تحصيل الديون المرتفعة لزيادة السيولة النقدية وتوسيع نطاق الخدمات."
                : "هناك تراجع طفيف في المبيعات مقارنة بالشهر الماضي. قد يكون من المفيد مراجعة قائمة المناديب وتنشيط التواصل مع العملاء القدامى."}
              {" "}كما يفضل البدء في إجراءات المتابعة للعمال الذين اقتربت فترتهم من 30 يوماً لتجنب أي تأخير قانوني.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
