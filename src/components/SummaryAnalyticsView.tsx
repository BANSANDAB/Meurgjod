import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  PieChart as PieIcon, 
  BarChart as BarIcon, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Transaction, Budget, AccountFilterType, isCoupleTransaction } from '../types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

interface SummaryAnalyticsViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  onBackToHome: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

type PeriodFilter = 'today' | '7days' | 'this-month' | 'last-month' | '3months' | '6months' | 'this-year' | 'all';

export const SummaryAnalyticsView: React.FC<SummaryAnalyticsViewProps> = ({
  transactions = [],
  budgets,
  onBackToHome,
  onSelectTransaction,
}) => {
  const [accountFilter, setAccountFilter] = useState<AccountFilterType>('couple');
  const [period, setPeriod] = useState<PeriodFilter>('this-month');
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'bar' | 'line'>('donut');

  // Filter transactions by account and period safely
  const filtered = useMemo(() => {
    const now = new Date();
    return (transactions || []).filter((t) => {
      if (!t) return false;

      // Account filter
      if (accountFilter === 'couple' && !isCoupleTransaction(t)) return false;
      if (accountFilter === 'personal' && isCoupleTransaction(t)) return false;

      // Period filter
      if (period === 'all') return true;
      if (!t.transaction_date) return false;
      const tDate = new Date(t.transaction_date);
      if (isNaN(tDate.getTime())) return false;

      if (period === 'today') {
        return tDate.toDateString() === now.toDateString();
      }
      if (period === '7days') {
        const diff = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (period === 'this-month') {
        return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
      }
      if (period === 'last-month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return tDate.getFullYear() === year && tDate.getMonth() === lastMonth;
      }
      if (period === '3months') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 90;
      }
      if (period === '6months') {
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 180;
      }
      if (period === 'this-year') {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, accountFilter, period]);

  // Aggregate totals safely
  const totalIncome = useMemo(() => {
    return (filtered || [])
      .filter((t) => t?.transaction_type === 'income')
      .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  }, [filtered]);

  const totalExpense = useMemo(() => {
    return (filtered || [])
      .filter((t) => t?.transaction_type === 'expense')
      .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  }, [filtered]);

  const netBalance = totalIncome - totalExpense;

  // Category breakdown for Donut Chart
  const categoryBreakdown = useMemo(() => {
    const expenses = (filtered || []).filter((t) => t?.transaction_type === 'expense');
    const map: { [key: string]: number } = {};
    for (const t of expenses) {
      const cat = t?.category || 'รายจ่ายอื่นๆ';
      map[cat] = (map[cat] || 0) + (Number(t?.amount) || 0);
    }
    const sorted = Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [filtered]);

  // Donut Chart Data (Compact sizing)
  const donutData = {
    labels: categoryBreakdown.slice(0, 5).map((c) => c.name),
    datasets: [
      {
        data: categoryBreakdown.slice(0, 5).map((c) => c.amount),
        backgroundColor: [
          '#FF6475',
          '#FBBF24',
          '#38BDF8',
          '#A78BFA',
          '#34D399',
        ],
        borderWidth: 1.5,
        borderColor: '#ffffff',
      },
    ],
  };

  // Bar Chart Data (Income vs Expense)
  const barData = {
    labels: ['ภาพรวมช่วงเวลานี้'],
    datasets: [
      {
        label: 'รายรับ (Income)',
        data: [totalIncome],
        backgroundColor: '#10B981',
        borderRadius: 8,
      },
      {
        label: 'รายจ่าย (Expense)',
        data: [totalExpense],
        backgroundColor: '#FF6475',
        borderRadius: 8,
      },
    ],
  };

  // Line Chart Data
  const lineData = useMemo(() => {
    const sortedChronological = [...(filtered || [])].sort((a, b) => {
      const tA = a?.transaction_date ? new Date(a.transaction_date).getTime() : 0;
      const tB = b?.transaction_date ? new Date(b.transaction_date).getTime() : 0;
      return tA - tB;
    });
    let running = 0;
    const labels: string[] = [];
    const balances: number[] = [];

    sortedChronological.forEach((t) => {
      const amt = Number(t?.amount) || 0;
      running += t?.transaction_type === 'income' ? amt : -amt;
      if (t?.transaction_date) {
        const d = new Date(t.transaction_date);
        if (!isNaN(d.getTime())) {
          labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
          balances.push(running);
        }
      }
    });

    return {
      labels: labels.slice(-10),
      datasets: [
        {
          label: 'คงเหลือ (บาท)',
          data: balances.slice(-10),
          borderColor: '#0284C7',
          backgroundColor: 'rgba(125, 211, 252, 0.25)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#0284C7',
        },
      ],
    };
  }, [filtered]);

  return (
    <div className="space-y-2.5 px-3 pb-24 text-navy-text">
      {/* Title & Filter Bar (Export CSV button REMOVED) */}
      <div className="glass-panel rounded-3xl p-3 shadow-cute border border-white/80 bg-white/85">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-extrabold text-navy-text flex items-center gap-1.5">
              <span>📊 สรุปยอดเงินและแนวโน้ม</span>
            </h2>
            <p className="text-[10px] text-navy-muted">วิเคราะห์สัดส่วนรายรับ-รายจ่ายเงินคู่</p>
          </div>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
            {filtered.length} รายการ
          </span>
        </div>

        {/* Account Filter Pills: เงินคู่ (Default) | ส่วนตัว | รวมทั้งหมด */}
        <div className="flex items-center gap-1 p-0.5 bg-white/90 rounded-xl border border-sky-100 shadow-xs mb-2">
          <button
            type="button"
            onClick={() => setAccountFilter('couple')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              accountFilter === 'couple'
                ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-xs'
                : 'text-navy-muted hover:text-navy-text'
            }`}
          >
            <span>💕 เงินคู่</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountFilter('personal')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              accountFilter === 'personal'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xs'
                : 'text-navy-muted hover:text-navy-text'
            }`}
          >
            <span>👤 ส่วนตัว</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountFilter('all')}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              accountFilter === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                : 'text-navy-muted hover:text-navy-text'
            }`}
          >
            <span>🌐 ทั้งหมด</span>
          </button>
        </div>

        {/* Time Period Filter Chips */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'today', label: 'วันนี้' },
            { key: '7days', label: '7 วัน' },
            { key: 'this-month', label: 'เดือนนี้' },
            { key: 'last-month', label: 'เดือนก่อน' },
            { key: '3months', label: '3 เดือน' },
            { key: 'this-year', label: 'ปีนี้' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key as PeriodFilter)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
                period === item.key
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-sky-50 text-slate-700 hover:bg-sky-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards (Compact Row) */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="p-2 rounded-2xl bg-white border border-sky-100 shadow-xs text-center">
          <span className="text-[9px] font-semibold text-navy-muted block">คงเหลือ</span>
          <p className={`text-xs sm:text-sm font-black truncate ${netBalance < 0 ? 'text-rose-600' : 'text-navy-text'}`}>
            {(Number(netBalance) || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[8px] text-navy-muted">บาท</span>
        </div>

        <div className="p-2 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-xs text-center">
          <span className="text-[9px] font-bold text-emerald-800 block">รายรับ</span>
          <p className="text-xs sm:text-sm font-extrabold text-emerald-600 truncate">
            +{(Number(totalIncome) || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[8px] text-emerald-700">บาท</span>
        </div>

        <div className="p-2 rounded-2xl bg-rose-50 border border-rose-100 shadow-xs text-center">
          <span className="text-[9px] font-bold text-rose-800 block">รายจ่าย</span>
          <p className="text-xs sm:text-sm font-extrabold text-rose-600 truncate">
            -{(Number(totalExpense) || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
          </p>
          <span className="text-[8px] text-rose-700">บาท</span>
        </div>
      </div>

      {/* Chart Section with Tabs (COMPACT SIZED CHART) */}
      <div className="glass-panel rounded-3xl p-3 shadow-cute border border-white/80 bg-white/85">
        {/* Chart Sub Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-sky-100">
          <span className="text-xs font-bold text-navy-text">กราฟสรุป</span>
          <div className="flex items-center gap-1 bg-sky-50 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveChartTab('donut')}
              className={`p-1 rounded-md text-xs font-bold transition-all ${
                activeChartTab === 'donut' ? 'bg-white shadow text-sky-700' : 'text-slate-500'
              }`}
              title="สัดส่วนรายจ่าย"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveChartTab('bar')}
              className={`p-1 rounded-md text-xs font-bold transition-all ${
                activeChartTab === 'bar' ? 'bg-white shadow text-sky-700' : 'text-slate-500'
              }`}
              title="เปรียบเทียบรับ-จ่าย"
            >
              <BarIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveChartTab('line')}
              className={`p-1 rounded-md text-xs font-bold transition-all ${
                activeChartTab === 'line' ? 'bg-white shadow text-sky-700' : 'text-slate-500'
              }`}
              title="แนวโน้มเงินสะสม"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chart Render (REDUCED COMPACT HEIGHT: ~135px) */}
        <div className="py-2 flex items-center justify-center h-36">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400">ไม่มีข้อมูลในช่วงเวลานี้</p>
          ) : activeChartTab === 'donut' ? (
            categoryBreakdown.length > 0 ? (
              <div className="w-32 h-32 sm:w-36 sm:h-36">
                <Doughnut
                  data={donutData}
                  options={{
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 6, font: { size: 9 }, padding: 4 } },
                    },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400">ยังไม่มีรายจ่ายในช่วงเวลานี้</p>
            )
          ) : activeChartTab === 'bar' ? (
            <div className="w-full h-32">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          ) : (
            <div className="w-full h-32">
              <Line
                data={lineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Top Spending Categories List */}
      <div className="glass-panel rounded-3xl p-3 shadow-cute border border-white/80 bg-white/85">
        <h3 className="text-xs font-bold text-navy-text mb-2">
          🏆 สัดส่วนรายจ่าย ({categoryBreakdown.length} หมวด)
        </h3>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">ไม่มีข้อมูลรายจ่าย</p>
        ) : (
          <div className="space-y-1.5">
            {categoryBreakdown.slice(0, 4).map((cat, idx) => {
              const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
              return (
                <div key={cat.name} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-navy-text truncate max-w-[160px]">
                      <span className="text-slate-400 font-bold mr-1">{idx + 1}.</span>
                      {cat.name}
                    </span>
                    <span className="font-extrabold text-rose-600">
                      {(Number(cat.amount) || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })} บ. ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
