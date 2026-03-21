import React, { useState } from 'react';
import { LogIn, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6 font-sans antialiased">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 bg-zinc-900 dark:bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 grayscale">
            <Shield className="text-zinc-100 dark:text-zinc-900 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">حلول لإدارة المؤسسات</h1>
          <p className="text-zinc-400 mt-3 text-sm font-medium uppercase tracking-widest">تسجيل الدخول للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mr-1">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all text-right text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              placeholder="أدخل اسم المستخدم"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mr-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-all text-right text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 py-5 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span className="tracking-tight">تسجيل الدخول</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-900 text-center">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} نظام حلول. جميع الحقوق محفوظة.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
