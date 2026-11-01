import React, { useState, useEffect } from 'react';
import { X, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, TransactionType, Category, Account } from '../types';

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  currentUser: string;
  onSave: (tx: Partial<Transaction>) => Promise<void>;
  onDelete?: (transactionId: string) => Promise<void>;
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  currentUser,
  onSave,
  onDelete,
  editingTransaction,
  initialType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('เงินคู่รายเดือน');
  const [recordedBy, setRecordedBy] = useState<string>(currentUser);
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [showExtra, setShowExtra] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.transaction_type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.account_id || 'เงินคู่รายเดือน');
      setRecordedBy(editingTransaction.user_name || currentUser);
      
      const d = new Date(editingTransaction.transaction_date);
      setDate(d.toISOString().split('T')[0]);
      setDescription(editingTransaction.description || '');
      setNote(editingTransaction.note || '');
      setReceiptImage(editingTransaction.receipt_image);
      if (editingTransaction.note || editingTransaction.receipt_image) {
        setShowExtra(true);
      }
    } else {
      setType(initialType);
      setAmount('');
      setCategory('');
      setAccountId('เงินคู่รายเดือน');
      setRecordedBy(currentUser);
      
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setDescription('');
      setNote('');
      setReceiptImage(undefined);
      setShowExtra(false);
    }
    setErrorMsg(null);
  }, [editingTransaction, initialType, isOpen, currentUser]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.transaction_type === type);

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setShowExtra(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (!category) {
      setErrorMsg('กรุณาเลือกหมวดหมู่');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const fullDate = `${date}T${new Date().toTimeString().slice(0, 5)}:00`;
      await onSave({
        transaction_id: editingTransaction ? editingTransaction.transaction_id : undefined,
        transaction_type: type,
        amount: numAmount,
        category: category,
        account_id: accountId,
        user_name: recordedBy,
        user_id: recordedBy === 'ตาล' ? 'user-tanz' : 'user-jo',
        couple_id: 'couple-1',
        transaction_date: fullDate,
        description: description || category,
        note: note,
        receipt_image: receiptImage
      });

      // Confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryEmoji = (cat: Category) => {
    if (cat.icon === 'Utensils' || cat.category_name.includes('อาหาร')) return '🍽️';
    if (cat.icon === 'Store' || cat.category_name.includes('7-Eleven') || cat.category_name.includes('CJ')) return '🏪';
    if (cat.icon === 'ShoppingCart' || cat.category_name.includes('ซื้อของ')) return '🛒';
    if (cat.icon === 'Car' || cat.category_name.includes('น้ำมัน')) return '🚗';
    if (cat.category_name.includes('ประกัน')) return '🛡️';
    if (cat.category_name.includes('สุขภาพ')) return '🏃';
    if (cat.category_name.includes('ยา')) return '💊';
    if (cat.category_name.includes('เน็ต') || cat.category_name.includes('ไฟ')) return '⚡';
    if (cat.category_name.includes('เงินคู่')) return '💕';
    if (cat.category_name.includes('เงินเดือน')) return '🪙';
    if (cat.category_name.includes('โบนัส')) return '🎁';
    return '📌';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-navy-text/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-3.5 shadow-cute-lg border border-white/90 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-sky-100">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{type === 'expense' ? '💸' : '💰'}</span>
            <h2 className="text-sm font-extrabold text-navy-text">
              {editingTransaction ? 'แก้ไขรายการเงินคู่' : 'บันทึกรายการเงินคู่'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-2.5 space-y-2.5">
          {/* Type Toggle: รายจ่าย vs รายรับ */}
          <div className="grid grid-cols-2 p-0.5 rounded-xl bg-sky-50 border border-sky-100">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
              className={`py-1 rounded-lg text-xs font-extrabold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-navy-muted hover:text-navy-text'
              }`}
            >
              💸 รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('');
              }}
              className={`py-1 rounded-lg text-xs font-extrabold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-navy-muted hover:text-navy-text'
              }`}
            >
              💰 รายรับ (Income)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xl font-black text-navy-text pl-3 pr-11 py-2 rounded-xl bg-sky-50/60 border-2 border-sky-300 focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-300"
                required
                autoFocus={!editingTransaction}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-navy-muted">
                บาท
              </span>
            </div>
          </div>

          {/* Category Selector (Dropdown / Dropbox) */}
          <div>
            <label className="block text-[10px] font-bold text-navy-text mb-1">
              เลือกหมวดหมู่ *
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-semibold p-2 pr-7 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none appearance-none cursor-pointer"
                required
              >
                <option value="">-- กรุณาเลือกหมวดหมู่ --</option>
                {availableCategories.map((c) => (
                  <option key={c.category_id} value={c.category_name}>
                    {getCategoryEmoji(c)} {c.category_name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-navy-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                ▼
              </span>
            </div>
          </div>

          {/* Row 1: Account + Date (2 columns side by side) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                กระเป๋า / บัญชี
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-xs font-semibold p-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none"
              >
                <option value="เงินคู่รายเดือน">เงินคู่รายเดือน (หลัก)</option>
                <option value="บัญชีส่วนตัว (โจ)">บัญชีส่วนตัว (โจ)</option>
                <option value="บัญชีส่วนตัว (ตาล)">บัญชีส่วนตัว (ตาล)</option>
                <option value="เงินสด">เงินสด</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                วันที่ทำรายการ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold p-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Row 2: Description & Quick Extra Toggle */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[10px] font-bold text-navy-text">
                รายละเอียดรายการ
              </label>
              <button
                type="button"
                onClick={() => setShowExtra(!showExtra)}
                className="text-[10px] font-bold text-sky-600 hover:underline"
              >
                {showExtra ? 'ซ่อนโน้ต/สลิป' : '+ เพิ่มโน้ต/แนบสลิป'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="เช่น ข้าวหมูกรอบ, น้ำมัน ปตท., ซื้อของเข้าบ้าน"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Collapsible Extra: Note & Slip Image */}
          {showExtra && (
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-fadeIn">
              <input
                type="text"
                placeholder="โน้ตช่วยจำ เช่น สั่งไลน์แมน, มื้อเย็นกับตาล"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs p-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer text-[11px] font-bold text-navy-text">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                  <span>{receiptImage ? 'เปลี่ยนรูปสลิป' : 'แนบภาพสลิป'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {receiptImage && (
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300">
                    <img src={receiptImage} alt="slip" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setReceiptImage(undefined)}
                      className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-1 flex items-center gap-2">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
                    await onDelete(editingTransaction.transaction_id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold active:scale-95 transition-all"
                title="ลบรายการ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-cute flex items-center justify-center gap-1.5 active:scale-98 transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
