import React, { useState } from 'react';
import { X, Scale, Plus, TrendingDown, TrendingUp, History, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HealthRecord } from '../types';

interface HealthTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthRecords: HealthRecord[];
  currentUser: string;
  onSaveHealthRecord: (record: HealthRecord) => Promise<void>;
  isInline?: boolean;
}

export const HealthTrackerModal: React.FC<HealthTrackerModalProps> = ({
  isOpen,
  onClose,
  healthRecords,
  currentUser,
  onSaveHealthRecord,
  isInline = false,
}) => {
  const [activeUser, setActiveUser] = useState<string>(currentUser || 'โจ');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>(activeUser === 'โจ' ? '175' : '160');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter records for active member
  const userRecords = healthRecords
    .filter((r) => r.user_name === activeUser)
    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());

  const latestRecord = userRecords[0];
  const previousRecord = userRecords[1];

  let weightDiff = 0;
  if (latestRecord && previousRecord) {
    weightDiff = parseFloat((latestRecord.weight_kg - previousRecord.weight_kg).toFixed(2));
  }

  // Calculate BMI helper
  const calculateBMI = (w: number, h: number) => {
    if (h <= 0 || w <= 0) return 0;
    const heightInMeters = h / 100;
    return parseFloat((w / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'น้ำหนักน้อย / ผอม', color: 'text-sky-600', bg: 'bg-sky-100' };
    if (bmi < 23) return { label: 'สมส่วน / สุขภาพดี', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    if (bmi < 25) return { label: 'น้ำหนักเกิน / ท้วม', color: 'text-amber-700', bg: 'bg-amber-100' };
    return { label: 'โรคอ้วน', color: 'text-rose-700', bg: 'bg-rose-100' };
  };

  const currentBMI = latestRecord ? latestRecord.bmi : calculateBMI(parseFloat(weight) || 70, parseFloat(height) || 170);
  const bmiCategory = getBMICategory(currentBMI);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) return;

    setIsSubmitting(true);
    try {
      const bmi = calculateBMI(w, h);
      const newRecord: HealthRecord = {
        health_id: `WT${Date.now()}`,
        user_id: activeUser === 'ตาล' ? 'user-tanz' : 'user-jo',
        user_name: activeUser,
        record_date: date,
        weight_kg: w,
        height_cm: h,
        bmi: bmi,
        note: note,
        created_at: new Date().toISOString()
      };

      await onSaveHealthRecord(newRecord);
      confetti({ particleCount: 35, spread: 45, origin: { y: 0.6 } });
      setShowAddForm(false);
      setWeight('');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div className="space-y-2.5">
      {/* Compact User Switcher (โจ / ตาล) */}
      <div className="grid grid-cols-2 p-0.5 rounded-xl bg-sky-50 border border-sky-100 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveUser('โจ')}
          className={`py-1 rounded-lg text-xs font-bold transition-all ${
            activeUser === 'โจ'
              ? 'bg-sky-500 text-white shadow-2xs'
              : 'text-navy-muted hover:text-navy-text'
          }`}
        >
          👦 โจ
        </button>
        <button
          type="button"
          onClick={() => setActiveUser('ตาล')}
          className={`py-1 rounded-lg text-xs font-bold transition-all ${
            activeUser === 'ตาล'
              ? 'bg-pink-500 text-white shadow-2xs'
              : 'text-navy-muted hover:text-navy-text'
          }`}
        >
          👧 ตาล
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <Lock className="w-2.5 h-2.5 text-emerald-600" />
          <span>ข้อมูลส่วนบุคคล</span>
        </span>
        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
          🔒 เฉพาะคุณเห็น
        </span>
      </div>

      {/* Health Summary Dashboard Card */}
      {latestRecord ? (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-50/90 via-rose-50/90 to-amber-50/90 border border-pink-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-rose-800">น้ำหนักล่าสุด ({latestRecord.record_date})</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <h3 className="text-2xl font-black text-navy-text">
                  {latestRecord.weight_kg}
                </h3>
                <span className="text-xs font-bold text-navy-muted">กก.</span>
              </div>
            </div>

            {/* BMI Pill */}
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-500">BMI ผู้ใหญ่</span>
              <p className="text-lg font-black text-navy-text leading-tight">{latestRecord.bmi}</p>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.2 rounded-full ${bmiCategory.bg} ${bmiCategory.color}`}>
                {bmiCategory.label}
              </span>
            </div>
          </div>

          {/* Visual BMI Bar Gauge */}
          <div className="mt-2 pt-1.5 border-t border-pink-200/60">
            <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 mb-0.5">
              <span className="text-sky-600">ผอม (&lt;18.5)</span>
              <span className="text-emerald-600">สมส่วน (18.5-22.9)</span>
              <span className="text-amber-600">ท้วม (23-24.9)</span>
              <span className="text-rose-600">อ้วน (≥25)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden flex">
              <div className="w-[25%] bg-sky-400" title="ผอม" />
              <div className="w-[35%] bg-emerald-400" title="สมส่วน" />
              <div className="w-[18%] bg-amber-400" title="ท้วม" />
              <div className="w-[22%] bg-rose-400" title="อ้วน" />
            </div>
          </div>

          {/* Change difference */}
          {previousRecord && (
            <div className="mt-2 pt-1.5 border-t border-pink-200/60 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-600">เทียบครั้งก่อน:</span>
              <span
                className={`flex items-center gap-1 font-bold ${
                  weightDiff < 0 ? 'text-emerald-600' : weightDiff > 0 ? 'text-rose-600' : 'text-slate-600'
                }`}
              >
                {weightDiff < 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>ลดลง {Math.abs(weightDiff)} กก. 👏</span>
                  </>
                ) : weightDiff > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>เพิ่มขึ้น +{weightDiff} กก.</span>
                  </>
                ) : (
                  <span>เท่าเดิม</span>
                )}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-sky-50/90 text-center border border-sky-100">
          <p className="text-xs font-bold text-navy-text">ยังไม่มีข้อมูลน้ำหนักของคุณ{activeUser}</p>
          <p className="text-[10px] text-navy-muted mt-0.5">กดปุ่มด้านล่างเพื่อเริ่มบันทึกครั้งแรกได้เลยค่ะ</p>
        </div>
      )}

      {/* Add Record Button or Form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 rounded-xl bg-pink-400 hover:bg-pink-500 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ บันทึกน้ำหนักวันนี้</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 rounded-2xl bg-pink-50/80 border border-pink-200 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-navy-text flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-pink-600" />
              <span>บันทึกน้ำหนักส่วนตัว</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
            >
              ยกเลิก
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                น้ำหนัก (กก.) *
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="เช่น 68.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full text-xs font-black p-2 rounded-xl bg-white border border-pink-200 text-navy-text focus:outline-none focus:border-pink-400"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                ส่วนสูง (ซม.)
              </label>
              <input
                type="number"
                step="1"
                min="50"
                max="250"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full text-xs font-bold p-2 rounded-xl bg-white border border-pink-200 text-navy-text focus:outline-none focus:border-pink-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                วันที่บันทึก
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-navy-text mb-0.5">
                หมายเหตุ (ถ้ามี)
              </label>
              <input
                type="text"
                placeholder="เช่น ชั่งตอนเช้า"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs p-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs active:scale-98 transition-all"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกน้ำหนัก'}
          </button>
        </form>
      )}

      {/* Weight History Card */}
      <div className="p-2.5 rounded-2xl bg-white/90 border border-slate-100 shadow-2xs">
        <h4 className="text-[11px] font-bold text-navy-text flex items-center gap-1 mb-1.5">
          <History className="w-3 h-3 text-sky-600" />
          <span>ประวัติย้อนหลัง ({userRecords.length} ครั้ง)</span>
        </h4>

        <div className="max-h-24 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100 scrollbar-none">
          {userRecords.length === 0 ? (
            <p className="p-2.5 text-center text-[10px] text-slate-400">ยังไม่มีประวัติการบันทึก</p>
          ) : (
            userRecords.slice(0, 10).map((r) => (
              <div key={r.health_id} className="p-1.5 flex items-center justify-between text-[11px] hover:bg-slate-50 transition-colors">
                <div>
                  <span className="font-bold text-navy-text">{r.record_date}</span>
                  {r.note && <span className="text-[9px] text-navy-muted ml-1.5">({r.note})</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-navy-text">{r.weight_kg} กก.</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    BMI {r.bmi}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // In inline tab mode: render directly inside Dashboard container
  if (isInline) {
    return (
      <div className="space-y-2.5 px-3 pb-24">
        <div className="glass-panel rounded-2xl p-2.5 shadow-xs border border-white/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <div>
                <h2 className="text-sm font-extrabold text-navy-text">บันทึกสุขภาพ & ติดตามน้ำหนัก</h2>
                <p className="text-[10px] text-navy-muted">คำนวณ BMI และติดตามสุขภาพส่วนตัว</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[9px] font-bold">
              ส่วนบุคคล 🔒
            </span>
          </div>
        </div>
        {content}
      </div>
    );
  }

  // Modal mode: Fits mobile screen (< 480px height), no scrolling required
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-navy-text/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-3.5 shadow-cute-lg border border-white/90 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-sky-100 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">⚖️</span>
            <div>
              <h2 className="text-sm font-extrabold text-navy-text">บันทึกสุขภาพ & น้ำหนัก</h2>
              <p className="text-[10px] text-navy-muted">คำนวณ BMI และติดตามน้ำหนักส่วนตัว</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {content}
      </div>
    </div>
  );
};
