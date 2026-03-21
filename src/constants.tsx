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
  PlayCircle,
  FileSearch,
  UserPlus
} from 'lucide-react';

export interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export const SECTIONS: Section[] = [
  { id: 'dashboard', title: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, description: 'مؤشرات الأداء والتقارير' },
  { id: 'tasks', title: 'المهام', icon: <CheckSquare size={18} />, description: 'توزيع ومتابعة العمل' },
  { id: 'accounting', title: 'المحاسبة', icon: <BarChart3 size={18} />, description: 'الديون والمبيعات والجرد' },
  { id: 'debts', title: 'الديون', icon: <CreditCard size={18} />, description: 'المبيعات الآجلة والتحصيل' },
  { id: 'reports', title: 'التقارير', icon: <BarChart3 size={18} />, description: 'تحليل الأرباح والمصروفات' },
  { id: 'brokers', title: 'الوسطاء', icon: <Wallet size={18} />, description: 'حسابات وعمولات الوسطاء' },
  { id: 'expenses', title: 'المصروفات', icon: <History size={18} />, description: 'تسجيل المصاريف التشغيلية' },
  { id: 'sponsors', title: 'الكفلاء', icon: <ShieldCheck size={18} />, description: 'إدارة الكفلاء والعمال' },
  { id: 'workers', title: 'العمال', icon: <Users size={18} />, description: 'بيانات الموظفين والعمالة' },
  { id: 'worker_followup', title: 'المتابعة', icon: <CalendarCheck size={18} />, description: 'متابعة دورية كل 30 يوم' },
  { id: 'file_analysis', title: 'الملفات', icon: <FileSearch size={18} />, description: 'تحليل البيانات تلقائياً' },
  { id: 'clients', title: 'العملاء', icon: <UserPlus size={18} />, description: 'إدارة بيانات العمليات' },
  { id: 'agents', title: 'المناديب', icon: <Users size={18} />, description: 'إدارة مناديب المتابعة' },
  { id: 'users', title: 'المستخدمين', icon: <Users size={18} />, description: 'إدارة حسابات الفريق' },
];
