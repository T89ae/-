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
  { id: 'dashboard', title: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, description: 'متابعة مؤشرات الأداء والتقارير العامة' },
  { id: 'tasks', title: 'المهام اليومية', icon: <CheckSquare size={20} />, description: 'توزيع ومتابعة سير العمل' },
  { id: 'accounting', title: 'المحاسبة المتكاملة', icon: <BarChart3 size={20} />, description: 'الديون، المبيعات، الجرد، والتقارير' },
  { id: 'debts', title: 'الديون والمبيعات', icon: <CreditCard size={20} />, description: 'نظام المبيعات الآجلة والتحصيل' },
  { id: 'reports', title: 'التقارير المالية', icon: <BarChart3 size={20} />, description: 'تحليل الأرباح والمصروفات' },
  { id: 'brokers', title: 'مستحقات الوسطاء', icon: <Wallet size={20} />, description: 'متابعة الحسابات والعمولات للوسطاء' },
  { id: 'expenses', title: 'المصروفات', icon: <History size={20} />, description: 'تسجيل ومتابعة المصاريف التشغيلية' },
  { id: 'sponsors', title: 'إدارة الكفلاء', icon: <ShieldCheck size={20} />, description: 'إدارة الكفلاء والعمال المرتبطين بهم' },
  { id: 'workers', title: 'إدارة العمال', icon: <Users size={20} />, description: 'بيانات الموظفين والعمالة والمهام' },
  { id: 'worker_followup', title: 'متابعة العمال الشهرية', icon: <CalendarCheck size={20} />, description: 'متابعة دورية للعمال كل 30 يوم' },
  { id: 'file_analysis', title: 'إدارة الملفات وتحليل البيانات', icon: <FileSearch size={20} />, description: 'رفع وتحليل الملفات واستخراج البيانات تلقائياً' },
  { id: 'clients', title: 'قاعدة العملاء', icon: <UserPlus size={20} />, description: 'إدارة بيانات العملاء والعمليات المرتبطة بهم' },
  { id: 'agents', title: 'مناديب المتابعة', icon: <Users size={20} />, description: 'إدارة المناديب وطلبات الخدمة والديون' },
];
