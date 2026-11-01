import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
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
  Activity,
  Image as ImageIcon
} from 'lucide-react';
import { Transaction, AccountFilterType, isCoupleTransaction } from '../types';

interface AllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onSelectTransaction: (t: Transaction) => void;
}

// Icon helper with safe string checking
const getCategoryIcon = (categoryName?: string) => {
  const name = categoryName || '';
  if (/ประกันรถ|ประกันยนต์|car insurance/i.test(name)) return <Shield className="w-4 h-4 text-indigo-500" />;
  if (/ค่าสุขภาพ|สุขภาพ/i.test(name)) return <Activity className="w-4 h-4 text-emerald-500" />;
  if (/อาหาร|ก๋วยเตี๋ยว|ข้าว|กิน/.test(name)) return <Utensils className="w-4 h-4 text-rose-500" />;
  if (/เซเว่น|7-11|cj/i.test(name)) return <Store className="w-4 h-4 text-amber-500" />;
  if (/ตลาด|ของใช้|ซื้อของ/i.test(name)) return <ShoppingCart className="w-4 h-4 text-orange-500" />;
  if (/น้ำมัน|เดินทาง|bts|mrt/i.test(name)) return <Car className="w-4 h-4 text-sky-500" />;
  if (/ซัก|อบผ้า/i.test(name)) return <Shirt className="w-4 h-4 text-purple-500" />;
  if (/กาแฟ|คาเฟ่|ขนม/i.test(name)) return <Coffee className="w-4 h-4 text-pink-500" />;
  if (/น้ำ|ไฟ|เน็ต/i.test(name)) return <Zap className="w-4 h-4 text-blue-500" />;
  if (/ยา|หมอ|รักษา/i.test(name)) return <HeartPulse className="w-4 h-4 text-red-500" />;
  if (/เงินเดือน|ค่าจ้าง/i.test(name)) return <Coins className="w-4 h-4 text-emerald-500" />;
  if (/เงินคู่|รับเงินคู่/i.test(name)) return <HeartHandshake className="w-4 h-4 text-teal-500" />;
  if (/โบนัส|ของขวัญ/i.test(name)) return <Gift className="w-4 h-4 text-green-500" />;
  return <FileText className="w-4 h-4 text-slate-500" />;
};

const formatThaiDate = (dateStr?: string) => {
  try {
    if (!dateStr) return { day: '20', month: 'ต.ค.', year: '69' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: '20', month: 'ต.ค.', year: '69' };
    const day = d.getDate().toString();
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const month = thaiMonths[d.getMonth()] || 'ต.ค.';
    const year = (d.getFullYear() + 543).toString().slice(-2);
    return { day, month, year };
  } catch {
    return { day: '20', month: 'ต.ค.', year: '69' };
  }
};

export const AllTransactionsModal: React.FC<AllTransactionsModalProps> = ({
  isOpen,
  onClose,
  transactions = [],
  onSelectTransaction,
}) => {
  const [accountFilter, setAccountFilter] = useState<AccountFilterType>('couple');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  // Filter all transactions safely
  const filtered = useMemo(() => {
    return (transactions || []).filter((t) => {
      if (!t) return false;

      // 1. Account filter
      if (accountFilter === 'couple' && !isCoupleTransaction(t)) return false;
      if (accountFilter === 'personal' && isCoupleTransaction(t)) return false;

      // 2. Type filter
      if (typeFilter !== 'all' && t.transaction_type !== typeFilter) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchNote = (t.note || '').toLowerCase().includes(q);
        const matchUser = (t.user_name || '').toLowerCase().includes(q);
        const matchAmt = (t.amount != null ? t.amount.toString() : '').includes(q);
        if (!matchCat && !matchDesc && !matchNote && !matchUser && !matchAmt) return false;
      }

      return true;
    }).sort((a, b) => {
      const tA = a?.transaction_date ? new Date(a.transaction_date).getTime() : 0;
      const tB = b?.transaction_date ? new Date(b.transaction_date).getTime() : 0;
      return tB - tA;
    });
  }, [transactions, accountFilter, typeFilter, searchQuery]);

  // Aggregate totals of filtered safely
  const totalIncome = filtered
    .filter((t) => t?.transaction_type === 'income')
    .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  const totalExpense = filtered
    .filter((t) => t?.transaction_type === 'expense')
    .reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-navy-text/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-4 shadow-cute-lg border border-white/90 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-sky-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📑</span>
            <div>
              <h2 className="text-sm font-extrabold text-navy-text">รายการที่บันทึกไว้ทั้งหมด</h2>
              <p className="text-[10px] text-navy-muted">
                พบ {filtered.length} จาก {transactions.length} รายการ (แตะเพื่อแก้ไข)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls (Shrink-0) */}
        <div className="py-2.5 space-y-2 border-b border-sky-50 shrink-0">
          {/* Account Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAccountFilter('couple')}
              className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                accountFilter === 'couple'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💕 เงินคู่
            </button>
            <button
              type="button"
              onClick={() => setAccountFilter('personal')}
              className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                accountFilter === 'personal'
                  ? 'bg-purple-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 ส่วนตัว
            </button>
            <button
              type="button"
              onClick={() => setAccountFilter('all')}
              className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                accountFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 รวมทั้งหมด
            </button>
          </div>

          {/* Search Bar + Type Toggle */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ค้นหารายการ, หมวดหมู่, หรือจำนวนเงิน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-7 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-sky-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  typeFilter === 'all' ? 'bg-sky-100 text-sky-800' : 'bg-slate-50 text-slate-500'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  typeFilter === 'expense' ? 'bg-rose-100 text-rose-800' : 'bg-slate-50 text-slate-500'
                }`}
              >
                จ่าย
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                  typeFilter === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 text-slate-500'
                }`}
              >
                รับ
              </button>
            </div>
          </div>

          {/* Mini KPI banner */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-sky-50 text-xs">
            <span className="text-[10px] text-navy-muted font-bold">
              รายรับ: <span className="text-emerald-600">+{(Number(totalIncome) || 0).toLocaleString()}</span> บ.
            </span>
            <span className="text-[10px] text-navy-muted font-bold">
              รายจ่าย: <span className="text-rose-600">-{(Number(totalExpense) || 0).toLocaleString()}</span> บ.
            </span>
            <span className="text-[10px] text-navy-muted font-bold">
              คงเหลือ: <span className={totalIncome - totalExpense >= 0 ? 'text-sky-700 font-black' : 'text-rose-600 font-black'}>
                {(Number(totalIncome - totalExpense) || 0).toLocaleString()}
              </span> บ.
            </span>
          </div>
        </div>

        {/* Scrollable Transaction List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-navy-muted">
              <p className="text-xs font-bold">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
              <p className="text-[10px] mt-0.5">ลองเปลี่ยนตัวกรองหรือคำค้นหาดูนะคะ</p>
            </div>
          ) : (
            filtered.map((tx) => {
              if (!tx) return null;
              const { day, month, year } = formatThaiDate(tx.transaction_date);
              const isIncome = tx.transaction_type === 'income';

              return (
                <div
                  key={tx.transaction_id || Math.random().toString()}
                  onClick={() => {
                    onClose();
                    onSelectTransaction(tx);
                  }}
                  className="py-2 flex items-center justify-between cursor-pointer hover:bg-sky-50/60 rounded-xl px-1.5 -mx-1 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Date Badge */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-black text-navy-text leading-none">{day}</span>
                      <span className="text-[8px] font-bold text-navy-muted leading-tight">{month} {year}</span>
                    </div>

                    {/* Category Icon */}
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      {getCategoryIcon(tx.category)}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 pr-2">
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
                        {tx.receipt_image && (
                          <ImageIcon className="w-3 h-3 text-sky-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-navy-muted truncate mt-0.5">
                        {tx.description || tx.account_id || ''}
                        {tx.user_name && ` • คุณ${tx.user_name}`}
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
                    <span className="text-[9px] text-navy-muted">บาท</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
