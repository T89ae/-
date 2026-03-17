import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  BarChart3, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  Globe,
  Zap,
  Target,
  LayoutDashboard
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#121212] font-sans text-slate-100 overflow-x-hidden transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-md z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00BFFF] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#00BFFF]/20">
              <Target size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">نظام ثقة</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <a href="#features" className="hover:text-[#00BFFF] transition-colors">المميزات</a>
            <a href="#about" className="hover:text-[#00BFFF] transition-colors">عن النظام</a>
            <a href="#contact" className="hover:text-[#00BFFF] transition-colors">اتصل بنا</a>
          </div>

          <button 
            onClick={onLoginClick}
            className="px-6 py-2.5 bg-[#00BFFF] text-white rounded-xl font-bold text-sm hover:bg-[#0099CC] transition-all shadow-lg shadow-[#00BFFF]/20 flex items-center gap-2"
          >
            تسجيل الدخول
            <ArrowLeft size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#00BFFF]/10 text-[#00BFFF] rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-[#00BFFF]/20">
              الجيل القادم من أنظمة الإدارة
            </span>
            <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tighter text-white mb-8">
              أدر أعمالك <span className="text-[#00BFFF]">بثقة</span> واحترافية متناهية
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-xl">
              نظام ثقة المتكامل يوفر لك الأدوات اللازمة لإدارة العمال، الكفلاء، المبيعات، والديون في منصة واحدة ذكية وسهلة الاستخدام.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onLoginClick}
                className="px-8 py-4 bg-[#00BFFF] text-white rounded-2xl font-bold text-lg hover:bg-[#0099CC] transition-all shadow-xl shadow-[#00BFFF]/20 flex items-center gap-3"
              >
                ابدأ الآن مجاناً
                <Zap size={20} className="text-white" />
              </button>
              <button className="px-8 py-4 bg-white/5 border-2 border-white/10 text-slate-300 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-3">
                مشاهدة العرض
                <Globe size={20} />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full"></div>
            <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-4">
              <img 
                src="https://picsum.photos/seed/dashboard/1200/800" 
                alt="Dashboard Preview" 
                className="rounded-2xl w-full shadow-inner opacity-90 dark:opacity-80"
                referrerPolicy="no-referrer"
              />
              {/* Floating elements */}
              <div className="absolute top-12 -right-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-50 dark:border-slate-700 flex items-center gap-4 animate-bounce">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-bold">إجمالي المبيعات</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">125,400 ر.س</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">لماذا تختار نظام ثقة؟</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">حلول متكاملة مصممة خصيصاً لتلبية احتياجاتك الإدارية والمالية</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'إدارة العمال', desc: 'متابعة دقيقة لبيانات العمال، المهن، والكفلاء مع نظام تنبيهات ذكي.', icon: Users, color: 'text-blue-500' },
              { title: 'المحاسبة المتكاملة', desc: 'إدارة المبيعات، المصروفات، والديون مع تقارير مالية تفصيلية.', icon: BarChart3, color: 'text-emerald-500' },
              { title: 'الأمان والخصوصية', desc: 'نظام صلاحيات متقدم يضمن وصول كل مستخدم لما يحتاجه فقط.', icon: Lock, color: 'text-rose-500' },
              { title: 'نظام اللقطات', desc: 'إمكانية استعادة البيانات في أي وقت لضمان استمرارية العمل.', icon: ShieldCheck, color: 'text-amber-500' },
              { title: 'لوحة تحكم ذكية', desc: 'واجهة عصرية توفر لك نظرة شاملة على أداء عملك في ثوانٍ.', icon: LayoutDashboard, color: 'text-indigo-500' },
              { title: 'دعم فني متواصل', desc: 'فريق متخصص جاهز للرد على استفساراتك وضمان عمل النظام بكفاءة.', icon: Globe, color: 'text-teal-500' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all"
              >
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon size={28} className={feature.color} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#00BFFF] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { label: 'مستخدم نشط', val: '+500' },
              { label: 'عملية يومية', val: '+10,000' },
              { label: 'نسبة الرضا', val: '99%' },
              { label: 'دعم فني', val: '24/7' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-5xl font-black mb-2">{stat.val}</div>
                <div className="text-white/80 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-20 bg-slate-900 dark:bg-slate-950 text-white border-t border-slate-800 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  ث
                </div>
                <span className="text-2xl font-black tracking-tighter">نظام ثقة</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                الخيار الأمثل لإدارة المؤسسات والشركات بذكاء واحترافية. نحن نؤمن بأن التكنولوجيا هي مفتاح النجاح.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">روابط سريعة</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">الرئيسية</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">المميزات</a></li>
                <li><a href="#about" className="hover:text-emerald-400 transition-colors">عن النظام</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">سياسة الخصوصية</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">تواصل معنا</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center gap-3">
                  <Globe size={18} className="text-emerald-400" />
                  <span>السعودية-جيزان-هروب</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap size={18} className="text-emerald-400" />
                  <span>Torkiali054@gmail.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <Users size={18} className="text-emerald-400" />
                  <span>0503858014</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6">النشرة البريدية</h4>
              <p className="text-slate-400 mb-4 text-sm">اشترك للحصول على آخر التحديثات والمميزات.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="بريدك الإلكتروني" 
                  className="bg-slate-800 dark:bg-slate-900 border-none rounded-xl px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button className="bg-emerald-600 p-2 rounded-xl hover:bg-emerald-700 transition-colors">
                  <CheckCircle2 size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-800 dark:border-slate-900 text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} نظام ثقة المتكامل. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
