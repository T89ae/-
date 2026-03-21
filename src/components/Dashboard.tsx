import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, FileText, AlertCircle, Loader2, 
  History as HistoryIcon, CheckSquare, DollarSign, GripVertical 
} from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLORS = ['#18181b', '#71717a', '#d4d4d8'];

const DEFAULT_CARD_ORDER = ['clients', 'tasks', 'revenue', 'profit', 'debts'];
const DEFAULT_CHART_ORDER = ['history', 'budget'];

export default function Dashboard({ currentUser, refreshCounter, token }: { currentUser: any, refreshCounter?: number, token: string }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_card_order');
    return saved ? JSON.parse(saved) : DEFAULT_CARD_ORDER;
  });
  const [chartOrder, setChartOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_chart_order');
    return saved ? JSON.parse(saved) : DEFAULT_CHART_ORDER;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': currentUser?.id?.toString() || '' 
        }
      });
      if (!res.ok) throw new Error('فشل في جلب البيانات');
      const data = await res.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshCounter]);

  useEffect(() => {
    localStorage.setItem('dashboard_card_order', JSON.stringify(cardOrder));
  }, [cardOrder]);

  useEffect(() => {
    localStorage.setItem('dashboard_chart_order', JSON.stringify(chartOrder));
  }, [chartOrder]);

  const handleDragEndCards = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndCharts = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setChartOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <AlertCircle className="text-zinc-300 mb-4" size={40} />
        <h3 className="heading-section mb-2">عذراً، حدث خطأ أثناء تحميل البيانات</h3>
        <p className="text-zinc-500 mb-6">{error || 'لا توجد بيانات متاحة حالياً'}</p>
        <button 
          onClick={fetchStats}
          className="btn-primary"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const pieData = [
    { name: 'المبيعات', value: stats.totalSales || 0 },
    { name: 'المصروفات', value: stats.totalExpenses || 0 },
  ];

  const renderCard = (id: string) => {
    switch (id) {
      case 'clients':
        return <SortableCard key="clients" id="clients" title="العملاء النشطون" value={(stats.clientsCount || 0).toString()} trend="نشط" />;
      case 'tasks':
        return <SortableCard key="tasks" id="tasks" title="مهام قيد الانتظار" value={(stats.pendingTasksCount || 0).toString()} trend="هام" />;
      case 'revenue':
        return <SortableCard key="revenue" id="revenue" title="إجمالي الإيرادات" value={`${(stats.totalSales || 0).toLocaleString()} ر.س`} trend="+12%" />;
      case 'profit':
        return <SortableCard key="profit" id="profit" title="صافي الأرباح" value={`${(stats.netProfit || 0).toLocaleString()} ر.س`} trend="+8%" />;
      case 'debts':
        return <SortableCard key="debts" id="debts" title="الديون المستحقة" value={`${(stats.outstandingDebts || 0).toLocaleString()} ر.س`} trend="متابعة" />;
      default:
        return null;
    }
  };

  const renderChart = (id: string) => {
    switch (id) {
      case 'history':
        return (
          <SortableChartItem key="history" id="history">
            <div className="bg-white dark:bg-zinc-900/40 p-10 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 h-full">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-meta">تحليل المبيعات والمصروفات</h3>
                <GripVertical className="text-zinc-200 dark:text-zinc-800 cursor-grab" size={14} />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        backgroundColor: '#18181b',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '12px'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#18181b" className="dark:stroke-zinc-100" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="expenses" name="المصروفات" stroke="#d4d4d8" className="dark:stroke-zinc-700" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SortableChartItem>
        );
      case 'budget':
        return (
          <SortableChartItem key="budget" id="budget">
            <div className="bg-white dark:bg-zinc-900/40 p-10 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 h-full">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-meta">توزيع الميزانية</h3>
                <GripVertical className="text-zinc-200 dark:text-zinc-800 cursor-grab" size={14} />
              </div>
              <div className="h-72 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#e4e4e7'} className="dark:fill-zinc-100 dark:even:fill-zinc-800" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        backgroundColor: '#18181b',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{((stats.totalSales || 0) + (stats.totalExpenses || 0)).toLocaleString()}</span>
                  <span className="text-meta opacity-60">إجمالي التدفق</span>
                </div>
              </div>
              <div className="flex justify-center gap-8 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100"></div>
                  <span className="text-meta opacity-60">المبيعات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                  <span className="text-meta opacity-60">المصروفات</span>
                </div>
              </div>
            </div>
          </SortableChartItem>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">مرحباً، {currentUser?.username}</h2>
        <p className="text-zinc-400 mt-2 text-sm font-medium uppercase tracking-widest">نظرة عامة على أداء المؤسسة اليوم</p>
      </div>

      {(stats.upcomingDebts > 0 || stats.workersNeedingFollowup > 0) && (
        <div className="flex flex-col gap-4">
          {stats.workersNeedingFollowup > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <AlertCircle size={18} className="text-zinc-400" />
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">يوجد {stats.workersNeedingFollowup} عمال تجاوزوا شهر من تاريخ تسجيلهم ويحتاجون متابعة.</div>
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'worker_followup' }))}
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4"
              >
                انتقال للمتابعة
              </button>
            </div>
          )}
          {stats.upcomingDebts > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl flex items-center gap-4">
              <AlertCircle size={18} className="text-zinc-400" />
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">يوجد {stats.upcomingDebts} ديون مستحقة خلال الـ 3 أيام القادمة.</div>
            </div>
          )}
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndCards}
      >
        <SortableContext 
          items={cardOrder}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {cardOrder.map(id => renderCard(id))}
          </div>
        </SortableContext>
      </DndContext>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndCharts}
      >
        <SortableContext 
          items={chartOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {chartOrder.map(id => renderChart(id))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCard({ id, title, value, trend }: { id: string, title: string, value: string, trend: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-white dark:bg-zinc-900/40 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 transition-all group cursor-grab active:cursor-grabbing hover:border-zinc-200 dark:hover:border-zinc-700"
    >
      <div className="flex justify-between items-start mb-6">
        <h4 className="text-meta opacity-60">{title}</h4>
        <GripVertical className="text-zinc-200 dark:text-zinc-800 group-hover:text-zinc-400 transition-colors" size={14} />
      </div>
      <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{value}</p>
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {trend}
      </span>
    </div>
  );
}

function SortableChartItem({ id, children }: { id: string, children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
      {children}
    </div>
  );
}
