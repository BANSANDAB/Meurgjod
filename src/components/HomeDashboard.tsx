import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  ChevronRight, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar,
  Utensils,
  ShoppingCart,
  Store,
  Car,
  Shirt,
  Coffee,
  Zap,
  HeartPulse,
  Coins,
  HeartHandshake,
  Gift,
  FileText,
  Shield,
  Activity
} from 'lucide-react';
import { Transaction, AccountFilterType, isCoupleTransaction } from '../types';
import { AllTransactionsModal } from './AllTransactionsModal';

interface HomeDashboardProps {
  transactions: Transaction[];
  onOpenRecord: () => void;
  onOpenHealth: () => void;
  onOpenOCR: () => void;
  onNavigateToSummary: () => void;
  onSelectTransaction: (t: Transaction) => void;
  onOpenWallet?: () => void;
  onOpenBudget?: () => void;
}

// Icon helper with safe string checking
const getCategoryIcon = (categoryName?: string) => {
  const name = categoryName || '';
  if (/ประกันรถ|ประกันยนต์|car insurance/i.test(name)) return <Shield className="w-3.5 h-3.5 text-indigo-500" />;
  if (/ค่าสุขภาพ|สุขภาพ/i.test(name)) return <Activity className="w-3.5 h-3.5 text-emerald-500" />;
  if (/อาหาร|ก๋วยเตี๋ยว|ข้าว|กิน/.test(name)) return <Utensils className="w-3.5 h-3.5 text-rose-500" />;
  if (/เซเว่น|7-11|cj/i.test(name)) return <Store className="w-3.5 h-3.5 text-amber-500" />;
  if (/ตลาด|ของใช้|ซื้อของ/i.test(name)) return <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />;
  if (/น้ำมัน|เดินทาง|bts|mrt/i.test(name)) return <Car className="w-3.5 h-3.5 text-sky-500" />;
  if (/ซัก|อบผ้า/i.test(name)) return <Shirt className="w-3.5 h-3.5 text-purple-500" />;
  if (/กาแฟ|คาเฟ่|ขนม/i.test(name)) return <Coffee className="w-3.5 h-3.5 text-pink-500" />;
  if (/น้ำ|ไฟ|เน็ต/i.test(name)) return <Zap className="w-3.5 h-3.5 text-blue-500" />;
  if (/ยา|หมอ|รักษา/i.test(name)) return <HeartPulse className="w-3.5 h-3.5 text-red-500" />;
  if (/เงินเดือน|ค่าจ้าง/i.test(name)) return <Coins className="w-3.5 h-3.5 text-emerald-500" />;
  if (/เงินคู่|รับเงินคู่/i.test(name)) return <HeartHandshake className="w-3.5 h-3.5 text-teal-500" />;
  if (/โบนัส|ของขวัญ/i.test(name)) return <Gift className="w-3.5 h-3.5 text-green-500" />;
  return <FileText className="w-3.5 h-3.5 text-slate-500" />;
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  transactions = [],
  onOpenRecord,
  onOpenWallet,
  onOpenHealth,
  onOpenOCR,
  onOpenBudget,
  onNavigateToSummary,
  onSelectTransaction,
}) => {
  // Thai month names helper
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const now = new Date();
  const curRealMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Account filter: 'couple' (Default) | 'personal' | 'all'
  const [accountFilter, setAccountFilter] = useState<AccountFilterType>('couple');
  // Period filter: always default to actual current calendar month according to real-time date
  const [selectedPeriod, setSelectedPeriod] = useState<string>(curRealMonthKey);
  // All transactions modal state
  const [allTransactionsModalOpen, setAllTransactionsModalOpen] = useState<boolean>(false);

  // Transactions filtered safely by account
  const accountTransactions = useMemo(() => {
    return (transactions || []).filter((t) => {
      if (!t) return false;
      if (accountFilter === 'couple' && !isCoupleTransaction(t)) return false;
      if (accountFilter === 'personal' && isCoupleTransaction(t)) return false;
      return true;
    });
  }, [transactions, accountFilter]);

  // Dynamically extract all months available in database
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, number>();
    for (const t of accountTransactions) {
      if (!t?.transaction_date) continue;
      const d = new Date(t.transaction_date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
    // Also include current calendar month
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(curKey)) {
      monthMap.set(curKey, 0);
    }

    // Sort descending (latest month first)
    const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => {
      const [yStr, mStr] = key.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const mIdx = m - 1;
      const count = monthMap.get(key) || 0;
      const isCur = key === curKey;
      const thaiName = thaiMonths[mIdx] || mStr;
      const thaiYr = y + 543;
      let label = `${thaiName} ${thaiYr}`;
      if (isCur) {
        label = `เดือนนี้ (${thaiName} ${thaiYr}${count > 0 ? ` • ${count} รายการ` : ''})`;
      } else {
        label = `${thaiName} ${thaiYr} (${count} รายการ)`;
      }
      return { key, label, count, isCur };
    });
  }, [accountTransactions]);

  // Always keep real-time current month as default
  useEffect(() => {
    if (!selectedPeriod) {
      setSelectedPeriod(curRealMonthKey);
    }
  }, [curRealMonthKey, selectedPeriod]);

  // Balance calculation with Carry-Forward (ยกยอดจากเดือนก่อน)
  const { filteredTransactions, carriedForwardBalance, periodIncome, periodExpense, netBalance, periodDisplayLabel } = useMemo(() => {
    let carried = 0;
    let periodList: Transaction[] = [];
    let displayLabel = 'ช่วงเวลา';

    if (selectedPeriod === 'all') {
      carried = 0;
      periodList = accountTransactions;
      displayLabel = 'ทั้งหมด';
    } else if (selectedPeriod && selectedPeriod.includes('-')) {
      const [yearStr, monthStr] = selectedPeriod.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1-12
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
      const startOfNextMonth = new Date(year, month, 1, 0, 0, 0);

      const mIdx = month - 1;
      displayLabel = `${thaiMonths[mIdx]} ${year + 543}`;

      // Prior transactions before this month (only for couple account; personal starts fresh)
      if (accountFilter === 'couple') {
        const prior = accountTransactions.filter((t) => {
          if (!t?.transaction_date) return false;
          const d = new Date(t.transaction_date);
          return !isNaN(d.getTime()) && d < startOfMonth;
        });
        const priorInc = prior.filter((t) => t?.transaction_type === 'income').reduce((s, t) => s + (Number(t?.amount) || 0), 0);
        const priorExp = prior.filter((t) => t?.transaction_type === 'expense').reduce((s, t) => s + (Number(t?.amount) || 0), 0);
        carried = priorInc - priorExp;
      } else {
        // ยอดส่วนตัวให้เริ่มใหม่ ไม่นับของเก่า
        carried = 0;
      }

      // Transactions in this month
      periodList = accountTransactions.filter((t) => {
        if (!t?.transaction_date) return false;
        const d = new Date(t.transaction_date);
        return !isNaN(d.getTime()) && d >= startOfMonth && d < startOfNextMonth;
      });
    } else {
      periodList = accountTransactions;
    }

    const inc = periodList.filter((t) => t?.transaction_type === 'income').reduce((s, t) => s + (Number(t?.amount) || 0), 0);
    const exp = periodList.filter((t) => t?.transaction_type === 'expense').reduce((s, t) => s + (Number(t?.amount) || 0), 0);
    const net = (Number(carried) || 0) + inc - exp;

    const sorted = [...periodList].sort((a, b) => {
      const tA = a?.transaction_date ? new Date(a.transaction_date).getTime() : 0;
      const tB = b?.transaction_date ? new Date(b.transaction_date).getTime() : 0;
      return tB - tA;
    });

    return {
      filteredTransactions: sorted,
      carriedForwardBalance: carried,
      periodIncome: inc,
      periodExpense: exp,
      netBalance: net,
      periodDisplayLabel: displayLabel
    };
  }, [accountTransactions, selectedPeriod]);

  // Format Thai dates safely
  const formatThaiDate = (dateStr?: string) => {
    try {
      if (!dateStr) return { day: '20', month: 'ต.ค.' };
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: '20', month: 'ต.ค.' };
      const day = d.getDate().toString();
      const month = thaiMonths[d.getMonth()] || 'ต.ค.';
      return { day, month };
    } catch {
      return { day: '20', month: 'ต.ค.' };
    }
  };

  return (
    <div className="space-y-2.5 px-3 pb-24 text-navy-text">
      {/* SECTION 1: UNIFIED DASHBOARD CARD */}
      <div className="glass-panel rounded-3xl p-3 shadow-cute relative overflow-hidden border border-white/80 bg-white/85">
        {/* Soft background glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-sky-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-blue-100/50 rounded-full blur-2xl pointer-events-none" />

        {/* Dashboard Header & Dynamic Period selector */}
        <div className="flex items-center justify-between mb-1.5 relative z-10 gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-600">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-xs text-navy-text tracking-wide">
              แดชบอร์ดเงินคู่
            </span>
          </div>

          {/* Period Selector Dropdown */}
          <div className="relative shrink-0 max-w-[190px]">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-sky-50 text-navy-text text-[11px] font-bold pl-6 pr-5 py-1 rounded-full border border-sky-200 shadow-xs focus:outline-none cursor-pointer truncate w-full"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <Calendar className="w-3 h-3 text-sky-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <span className="text-[8px] text-navy-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        {/* Account Filter Pills: เงินคู่ (Default) | ส่วนตัว (ตัด 'ทั้งหมด' ออก) */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-white/90 rounded-xl border border-sky-100 shadow-xs mb-2 relative z-10">
          <button
            type="button"
            onClick={() => setAccountFilter('couple')}
            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
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
            className={`py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
              accountFilter === 'personal'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xs'
                : 'text-navy-muted hover:text-navy-text'
            }`}
          >
            <span>👤 ส่วนตัว</span>
          </button>
        </div>

        {/* Main Balance Display (Prominent & Clear Centerpiece) */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-100/90 via-blue-50/90 to-indigo-50/90 border border-sky-200/90 shadow-xs flex items-center justify-between gap-2.5 mb-2 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 flex items-center justify-center shrink-0 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-navy-muted">
                  {accountFilter === 'couple' ? 'ยอดเงินคู่คงเหลือ' : 'ยอดเงินส่วนตัวคงเหลือ'}
                </span>
                <span className="text-[9px] text-sky-800 font-extrabold bg-sky-200/70 px-1.5 py-0.2 rounded-full">
                  {periodDisplayLabel}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${netBalance < 0 ? 'text-rose-600' : 'text-navy-text'}`}>
                  {(Number(netBalance) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-xs font-black text-navy-text">บาท</span>
              </div>
              {/* Carry Forward Indicator: แสดงเฉพาะเงินคู่ ส่วนตัวเริ่มใหม่ไม่นับของเก่า */}
              {accountFilter === 'couple' && (
                <p className="text-[9px] text-sky-700 font-semibold mt-0.5">
                  (ยอดยกมาจากเดือนก่อน: {carriedForwardBalance >= 0 ? '+' : ''}{(Number(carriedForwardBalance) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บ.)
                </p>
              )}
              {accountFilter === 'personal' && (
                <p className="text-[9px] text-purple-700 font-semibold mt-0.5">
                  (ยอดส่วนตัวรอบเดือนนี้ ไม่นับยอดยกมา)
                </p>
              )}
            </div>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-white/85 border border-sky-200 text-[9px] font-extrabold text-sky-700 shrink-0 shadow-xs">
            {accountFilter === 'couple' ? '💕 เงินคู่' : '👤 ส่วนตัว'}
          </div>
        </div>

        {/* Income & Expense at Bottom of Balance (Compact Chips) */}
        <div className="grid grid-cols-2 gap-1.5 mb-2 relative z-10">
          {/* Income */}
          <div className="px-2 py-1 rounded-xl bg-emerald-50/90 border border-emerald-200/70 flex items-center justify-between">
            <div className="flex items-center gap-1 min-w-0">
              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-2.5 h-2.5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800">รายรับ</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold text-emerald-600">
                +{(Number(periodIncome) || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[8px] text-emerald-700 ml-0.5">บ.</span>
            </div>
          </div>

          {/* Expense */}
          <div className="px-2 py-1 rounded-xl bg-rose-50/90 border border-rose-200/70 flex items-center justify-between">
            <div className="flex items-center gap-1 min-w-0">
              <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-2.5 h-2.5" />
              </div>
              <span className="text-[10px] font-bold text-rose-800">รายจ่าย</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold text-rose-600">
                -{(Number(periodExpense) || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[8px] text-rose-700 ml-0.5">บ.</span>
            </div>
          </div>
        </div>

        {/* Dashboard Sub-Actions (Summary & History shortcuts) */}
        <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-sky-100/90 relative z-10">
          <button
            onClick={onNavigateToSummary}
            className="flex items-center justify-between p-1.5 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/80 shadow-xs active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-600 shrink-0">
                <PieChart className="w-3.5 h-3.5" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[11px] font-bold text-navy-text truncate">สรุปยอดเงิน</p>
                <p className="text-[9px] text-navy-muted truncate">วิเคราะห์สัดส่วน</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-navy-muted group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          <button
            onClick={() => setAllTransactionsModalOpen(true)}
            className="flex items-center justify-between p-1.5 rounded-xl bg-sky-50/90 hover:bg-sky-100/90 border border-sky-200/80 shadow-xs active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-sky-400/20 flex items-center justify-center text-sky-600 shrink-0">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[11px] font-bold text-navy-text truncate">ดูย้อนหลัง</p>
                <p className="text-[9px] text-navy-muted truncate">
                  ตรวจประวัติ ({filteredTransactions.length > 0 ? filteredTransactions.length : accountTransactions.length})
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-navy-muted group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      {/* SECTION 2: QUICK FUNCTION BUTTONS (1 ROW: สแกนสลิป (ซ้ายสุด) • บันทึกเงินคู่ (กลาง) • บันทึกสุขภาพ (ขวา)) */}
      <div className="grid grid-cols-3 gap-2 px-1">
        {/* 1. สแกนสลิปอัตโนมัติ (ซ้ายสุด) */}
        <button
          type="button"
          onClick={onOpenOCR}
          className="h-16 rounded-2xl bg-white/85 hover:bg-white border border-emerald-200/90 shadow-xs hover:shadow-cute flex items-center justify-center p-1.5 active:scale-95 transition-all group"
          title="สแกนสลิปอัตโนมัติ"
        >
          <img
            src="./assets/btn-ocr.png"
            alt="สแกนสลิป"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        </button>

        {/* 2. บันทึกเงินคู่ (กลาง) */}
        <button
          type="button"
          onClick={onOpenRecord}
          className="h-16 rounded-2xl bg-white/85 hover:bg-white border border-amber-200/90 shadow-xs hover:shadow-cute flex items-center justify-center p-1.5 active:scale-95 transition-all group"
          title="บันทึกเงินคู่"
        >
          <img
            src="./assets/card-record.png"
            alt="บันทึกเงินคู่"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        </button>

        {/* 3. บันทึกสุขภาพ (ขวาสุด) */}
        <button
          type="button"
          onClick={onOpenHealth}
          className="h-16 rounded-2xl bg-white/85 hover:bg-white border border-pink-200/90 shadow-xs hover:shadow-cute flex items-center justify-center p-1.5 active:scale-95 transition-all group"
          title="บันทึกสุขภาพ"
        >
          <img
            src="./assets/card-health.png"
            alt="บันทึกสุขภาพ"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        </button>
      </div>

      {/* SECTION 3: RECENT TRANSACTIONS (COMPACT & CLICK TO VIEW ALL) */}
      {(() => {
        const isShowingFallbackRecent = filteredTransactions.length === 0 && accountTransactions.length > 0;
        const displayTransactions = filteredTransactions.length > 0 ? filteredTransactions.slice(0, 4) : accountTransactions.slice(0, 4);
        const totalDisplayCount = filteredTransactions.length > 0 ? filteredTransactions.length : accountTransactions.length;

        return (
          <div className="glass-panel rounded-3xl p-3 shadow-cute border border-white/80 bg-white/85">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0">📑</span>
                <h3 className="font-extrabold text-xs text-navy-text truncate">
                  {isShowingFallbackRecent ? 'รายการเงินคู่ล่าสุดที่บันทึกไว้' : 'รายการรายรับ–รายจ่ายเงินคู่'}
                </h3>
              </div>
              <button
                onClick={() => setAllTransactionsModalOpen(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 active:scale-95 transition-all shrink-0 ml-1"
              >
                <span>ดูทั้งหมด ({totalDisplayCount})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isShowingFallbackRecent && (
              <div className="mb-2 px-2.5 py-1 rounded-xl bg-sky-50/90 border border-sky-100 flex items-center justify-between text-[10px] text-sky-800">
                <span className="font-semibold">💡 รอบเดือนนี้ยังไม่มีรายการใหม่ ดึงรายการล่าสุดมาแสดง:</span>
              </div>
            )}

            {displayTransactions.length === 0 ? (
              <div className="py-4 text-center flex flex-col items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-lg mb-1 animate-bounce">
                  🌱
                </div>
                <p className="text-xs font-bold text-navy-text">ยังไม่มีรายการในระบบ</p>
                <button
                  onClick={onOpenRecord}
                  className="mt-2 px-3 py-1 rounded-full bg-sky-400 hover:bg-sky-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                >
                  + เพิ่มรายการแรก
                </button>
              </div>
            ) : (
              <div className="divide-y divide-sky-100/60">
                {displayTransactions.map((tx) => {
                  if (!tx) return null;
                  const { day, month } = formatThaiDate(tx.transaction_date);
                  const isIncome = tx.transaction_type === 'income';

                  return (
                    <div
                      key={tx.transaction_id || Math.random().toString()}
                      onClick={() => onSelectTransaction(tx)}
                      className="py-1.5 flex items-center justify-between cursor-pointer hover:bg-sky-50/50 rounded-xl px-1.5 -mx-1 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Date Badge */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[11px] font-black text-navy-text leading-none">{day}</span>
                          <span className="text-[8px] font-semibold text-navy-muted leading-tight">{month}</span>
                        </div>

                        {/* Category Icon */}
                        <div className="w-7 h-7 rounded-full bg-sky-100/70 border border-white flex items-center justify-center shrink-0">
                          {getCategoryIcon(tx.category)}
                        </div>

                        {/* Details */}
                        <div className="truncate min-w-0 pr-1">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[8px] font-extrabold px-1 rounded ${
                                isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isIncome ? 'รับ' : 'จ่าย'}
                            </span>
                            <p className="text-xs font-bold text-navy-text truncate">
                              {tx.category || 'ทั่วไป'}
                            </p>
                          </div>
                          <p className="text-[9px] text-navy-muted truncate mt-0.2">
                            {tx.description || tx.account_id || ''}
                            {tx.user_name && ` (${tx.user_name})`}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-black ${
                            isIncome ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {(Number(tx.amount) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-[8px] text-navy-muted">บาท</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ALL TRANSACTIONS MODAL (WHEN CLICKING ดูทั้งหมด) */}
      <AllTransactionsModal
        isOpen={allTransactionsModalOpen}
        onClose={() => setAllTransactionsModalOpen(false)}
        transactions={transactions}
        onSelectTransaction={onSelectTransaction}
      />
    </div>
  );
};
