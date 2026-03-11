import { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  Mail, 
  ShieldCheck, 
  Save, 
  Loader2,
  Image as ImageIcon,
  Lock,
  Server
} from 'lucide-react';

export default function SystemSettings({ currentUser }: { currentUser: any }) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          headers: { 'X-User-Id': currentUser?.id?.toString() || '' }
        });
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('تم حفظ الإعدادات بنجاح');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const sections = [
    { id: 'general', title: 'الإعدادات العامة', icon: <Globe size={20} /> },
    { id: 'security', title: 'الأمان والتسجيل', icon: <ShieldCheck size={20} /> },
    { id: 'email', title: 'إعدادات البريد (SMTP)', icon: <Mail size={20} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">إعدادات النظام</h2>
          <p className="text-slate-500">تخصيص الخيارات العامة والتقنية للموقع</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          <span>حفظ الإعدادات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeSection === section.id 
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-100' 
                : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              {section.icon}
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-12">
          {activeSection === 'general' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Globe size={24} /></div>
                <h3 className="text-xl font-black text-slate-900">المعلومات الأساسية</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mr-1">اسم الموقع</label>
                  <input 
                    type="text"
                    value={settings.site_name || ''}
                    onChange={e => updateSetting('site_name', e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mr-1">البريد الرسمي</label>
                  <input 
                    type="email"
                    value={settings.official_email || ''}
                    onChange={e => updateSetting('official_email', e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 mr-1">رابط الشعار (Logo URL)</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={settings.site_logo || ''}
                      onChange={e => updateSetting('site_logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
                    />
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border border-dashed border-slate-200">
                      {settings.site_logo ? <img src={settings.site_logo} alt="Logo" className="w-10 h-10 object-contain" /> : <ImageIcon size={24} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ShieldCheck size={24} /></div>
                <h3 className="text-xl font-black text-slate-900">الأمان والتسجيل</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl">
                  <div>
                    <h4 className="font-bold text-slate-900">تفعيل تسجيل الأعضاء الجدد</h4>
                    <p className="text-sm text-slate-500">السماح للمستخدمين بإنشاء حسابات بأنفسهم</p>
                  </div>
                  <button 
                    onClick={() => updateSetting('allow_registration', settings.allow_registration === '1' ? '0' : '1')}
                    className={`w-14 h-8 rounded-full transition-all relative ${settings.allow_registration === '1' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.allow_registration === '1' ? 'right-7' : 'right-1'}`}></div>
                  </button>
                </div>

                <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4">
                  <Lock className="text-amber-600 shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-amber-900">تنبيه أمني</h4>
                    <p className="text-sm text-amber-700">عند تعطيل التسجيل، يمكن فقط للمديرين إضافة مستخدمين جدد من خلال لوحة التحكم.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'email' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Server size={24} /></div>
                <h3 className="text-xl font-black text-slate-900">إعدادات خادم البريد (SMTP)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mr-1">SMTP Host</label>
                  <input 
                    type="text"
                    value={settings.smtp_host || ''}
                    onChange={e => updateSetting('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mr-1">SMTP Port</label>
                  <input 
                    type="text"
                    value={settings.smtp_port || ''}
                    onChange={e => updateSetting('smtp_port', e.target.value)}
                    placeholder="587"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mr-1">SMTP User</label>
                  <input 
                    type="text"
                    value={settings.smtp_user || ''}
                    onChange={e => updateSetting('smtp_user', e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 mr-1">SMTP Password</label>
                  <input 
                    type="password"
                    value={settings.smtp_pass || ''}
                    onChange={e => updateSetting('smtp_pass', e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-left"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
