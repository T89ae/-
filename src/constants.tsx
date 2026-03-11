import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Files, 
  Users, 
  UserSquare2, 
  CreditCard, 
  History, 
  ShieldCheck, 
  BarChart3, 
  Wallet, 
  CalendarCheck, 
  CheckSquare, 
  MessageSquare, 
  Settings, 
  Lock, 
  PlayCircle 
} from 'lucide-react';

export interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export const SECTIONS: Section[] = [
  { id: 'dashboard', title: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, description: 'متابعة مؤشرات الأداء والتقارير العامة' },
  { id: 'manual', title: 'دليل المستخدم', icon: <BookOpen size={20} />, description: 'شرح شامل لجميع أقسام النظام' },
  { id: 'files', title: 'إدارة الملفات', icon: <Files size={20} />, description: 'تنظيم وتحليل الملفات والوثائق' },
  { id: 'brokers', title: 'مستحقات الوسطاء', icon: <Wallet size={20} />, description: 'متابعة الحسابات والعمولات للوسطاء' },
  { id: 'snapshots', title: 'نظام اللقطات', icon: <ShieldCheck size={20} />, description: 'استعادة البيانات والأمان التقني' },
  { id: 'workers', title: 'إدارة العمال', icon: <Users size={20} />, description: 'بيانات الموظفين والعمالة والمهام' },
  { id: 'sponsors', title: 'إدارة الكفلاء', icon: <ShieldCheck size={20} />, description: 'إدارة الكفلاء والعمال المرتبطين بهم' },
  { id: 'clients', title: 'إدارة العملاء', icon: <UserSquare2 size={20} />, description: 'قاعدة بيانات العملاء والطلبات' },
  { id: 'debts', title: 'الديون والمبيعات', icon: <CreditCard size={20} />, description: 'نظام المبيعات الآجلة والتحصيل' },
  { id: 'reports', title: 'التقارير المالية', icon: <BarChart3 size={20} />, description: 'تحليل الأرباح والمصروفات' },
  { id: 'expenses', title: 'المصروفات', icon: <History size={20} />, description: 'تسجيل ومتابعة المصاريف التشغيلية' },
  { id: 'attendance', title: 'الحضور والانصراف', icon: <CalendarCheck size={20} />, description: 'متابعة دوام الموظفين' },
  { id: 'accounting', title: 'المحاسبة المتكاملة', icon: <BarChart3 size={20} />, description: 'الديون، المبيعات، الجرد، والتقارير' },
  { id: 'tasks', title: 'المهام اليومية', icon: <CheckSquare size={20} />, description: 'توزيع ومتابعة سير العمل' },
  { id: 'messages', title: 'المراسلات', icon: <MessageSquare size={20} />, description: 'التواصل الداخلي والاشعارات' },
  { id: 'settings', title: 'إعدادات النظام', icon: <Settings size={20} />, description: 'تخصيص خيارات النظام' },
  { id: 'permissions', title: 'الصلاحيات', icon: <Lock size={20} />, description: 'إدارة أدوار المستخدمين' },
  { id: 'admin_users', title: 'إدارة المستخدمين', icon: <Users size={20} />, description: 'التحكم في حسابات الموظفين والمديرين' },
  { id: 'admin_settings', title: 'إعدادات النظام', icon: <Settings size={20} />, description: 'تخصيص الخيارات العامة للموقع' },
  { id: 'admin_logs', title: 'سجل النشاطات', icon: <History size={20} />, description: 'مراقبة جميع العمليات في النظام' },
  { id: 'video', title: 'العرض التوضيحي', icon: <PlayCircle size={20} />, description: 'فيديو تفاعلي لشرح الواجهة' },
];
