import React, { useState } from 'react';
import { X, Camera, Upload, Check, AlertCircle, Scan, ArrowRight, RefreshCw } from 'lucide-react';
import { OCRService, OCRSlipResult } from '../services/ocrService';
import { Transaction, Category, Account } from '../types';
import confetti from 'canvas-confetti';

interface SlipScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  existingTransactions: Transaction[];
  currentUser: string;
  geminiApiKey?: string;
  onConfirmTransaction: (tx: Partial<Transaction>) => Promise<void>;
}

export const SlipScannerModal: React.FC<SlipScannerModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  existingTransactions,
  currentUser,
  geminiApiKey,
  onConfirmTransaction,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<OCRSlipResult | null>(null);

  // Editable fields after scan
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('อาหารและเครื่องดื่ม');
  const [accountId, setAccountId] = useState<string>('เงินคู่รายเดือน');
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read image for preview
    const reader = new FileReader();
    reader.onload = async () => {
      setSelectedImage(reader.result as string);
      setIsScanning(true);
      setScanResult(null);

      try {
        const result = await OCRService.scanSlip(file, geminiApiKey);
        setScanResult(result);

        // Populate form
        const amtStr = result.detectedAmount ? result.detectedAmount.toString() : '';
        setAmount(amtStr);
        setDate(result.detectedDate || new Date().toISOString().split('T')[0]);
        setDescription(result.detectedDescription || 'สแกนสลิปโอนเงิน');
        setCategory(result.detectedCategory || 'อาหารและเครื่องดื่ม');

        // Check for duplicate transaction
        if (result.detectedAmount) {
          const match = existingTransactions.find(
            (t) =>
              t.amount === result.detectedAmount &&
              (t.transaction_date.startsWith(result.detectedDate || '') ||
                t.description === result.detectedDescription)
          );
          setIsDuplicate(!!match);
        }
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmTransaction({
        transaction_type: 'expense',
        amount: numAmount,
        category: category,
        description: description,
        account_id: accountId,
        user_name: currentUser,
        user_id: currentUser === 'ตาล' ? 'user-tanz' : 'user-jo',
        couple_id: 'couple-1',
        transaction_date: `${date}T${new Date().toTimeString().slice(0, 5)}:00`,
        receipt_image: selectedImage || undefined,
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetScan = () => {
    setSelectedImage(null);
    setScanResult(null);
    setAmount('');
    setDescription('');
    setIsDuplicate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-navy-text/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-4 shadow-cute-lg border border-white/90 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <h2 className="text-sm font-extrabold text-navy-text">สแกนสลิปโอนเงิน</h2>
              <p className="text-[10px] text-navy-muted">อ่านยอดเงิน วันที่ และสร้างรายการอัตโนมัติ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload / Camera Section */}
        {!selectedImage ? (
          <div className="my-3 p-5 border-2 border-dashed border-sky-300 rounded-2xl bg-sky-50/50 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2 shadow-inner">
              <Scan className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xs font-bold text-navy-text mb-0.5">
              เลือกรูปภาพสลิป หรือ ถ่ายรูปสลิป
            </h3>
            <p className="text-[10px] text-navy-muted max-w-xs mb-3">
              รองรับสลิปธนาคารทุกแห่ง เช่น KBank, SCB, PromptPay
            </p>

            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-cute cursor-pointer active:scale-95 transition-all">
                <Camera className="w-3.5 h-3.5" />
                <span>ถ่ายรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-cute cursor-pointer active:scale-95 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>เลือกรูปจากเครื่อง</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="my-2.5 space-y-2.5">
            {/* Image Preview & Scanning status */}
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                <img src={selectedImage} alt="slip" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                {isScanning ? (
                  <div className="flex items-center gap-2 text-sky-600 text-xs font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังประมวลผลสลิป...</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                      ✓ ตรวจพบข้อมูลสลิป
                    </span>
                    <p className="text-[10px] text-navy-muted mt-0.5 truncate">
                      ตรวจสอบและแก้ไขข้อมูลก่อนกดยืนยัน
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetScan}
                className="text-[11px] font-bold text-sky-600 hover:underline shrink-0"
              >
                เปลี่ยนรูป
              </button>
            </div>

            {/* Duplicate warning */}
            {isDuplicate && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-[11px] font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ตรวจพบรายการจำนวนเงินและวันที่ตรงกันแล้ว</span>
              </div>
            )}

            {/* Extracted Form */}
            <div className="space-y-2">
              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-navy-text mb-0.5">
                  จำนวนเงิน (บาท) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-lg font-black text-navy-text pl-3 pr-10 py-1.5 rounded-xl bg-sky-50/70 border-2 border-sky-300 focus:outline-none focus:border-sky-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-navy-muted">
                    บาท
                  </span>
                </div>
              </div>

              {/* 2-Cols: Category + Account */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                    หมวดหมู่
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-semibold p-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    {categories
                      .filter((c) => c.transaction_type === 'expense')
                      .map((c) => (
                        <option key={c.category_id} value={c.category_name}>
                          {c.category_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                    บันทึกลงบัญชี
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full text-xs font-semibold p-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    <option value="เงินคู่รายเดือน">เงินคู่รายเดือน (หลัก)</option>
                    <option value="บัญชีส่วนตัว (โจ)">บัญชีส่วนตัว (โจ)</option>
                    <option value="บัญชีส่วนตัว (ตาล)">บัญชีส่วนตัว (ตาล)</option>
                    <option value="เงินสด">เงินสด</option>
                  </select>
                </div>
              </div>

              {/* 2-Cols: Date + Description */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                    วันที่ทำรายการ
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                    รายละเอียด / ผู้รับ
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="เช่น ข้าวหมูกรอบ, ปตท."
                    className="w-full text-xs p-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                className="w-2/3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-cute flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึกรายการ'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
