import React, { useState } from 'react';
import { 
  User, 
  Users, 
  Palette, 
  Bell, 
  Layers, 
  Building2, 
  Shield, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Check, 
  ExternalLink,
  RefreshCw,
  Key
} from 'lucide-react';
import { AppSettings, ThemeKey } from '../types';
import { GoogleSheetsService, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_URL } from '../services/googleSheetsService';

interface SettingsViewProps {
  settings: AppSettings;
  currentUser: string;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenThemeModal: () => void;
  onToggleUser: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onOpenThemeModal,
  onToggleUser,
}) => {
  const [gasUrl, setGasUrl] = useState<string>(settings.gas_webapp_url || '');
  const [geminiKey, setGeminiKey] = useState<string>(settings.gemini_api_key || '');
  const [testingStatus, setTestingStatus] = useState<{ testing: boolean; message?: string; success?: boolean } | null>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const handleTestConnection = async () => {
    setTestingStatus({ testing: true });
    const res = await GoogleSheetsService.testConnection(gasUrl);
    setTestingStatus({
      testing: false,
      message: res.message,
      success: res.success,
    });
  };

  const handleSaveConfigs = () => {
    onUpdateSettings({
      gas_webapp_url: gasUrl,
      gemini_api_key: geminiKey,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-4 px-4 pb-28">
      {/* Title */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute border border-white/80">
        <h2 className="text-lg font-bold text-navy-text flex items-center gap-2">
          <span>⚙️ ตั้งค่าระบบ</span>
        </h2>
        <p className="text-xs text-navy-muted">จัดการสมาชิก การเชื่อมต่อ และความเป็นส่วนตัว</p>
      </div>

      {/* Profile & Couple Switcher */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute border border-white/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-sky-300 shadow-sm bg-sky-100 flex items-center justify-center text-xl">
              {currentUser === 'โจ' ? '👦' : '👧'}
            </div>
            <div>
              <h3 className="text-sm font-black text-navy-text">
                ผู้ใช้งานปัจจุบัน: คุณ{currentUser}
              </h3>
              <p className="text-[11px] text-navy-muted">
                คู่รัก: โจ & ตาล (พื้นที่เงินคู่ Jo-Tanz)
              </p>
            </div>
          </div>

          <button
            onClick={onToggleUser}
            className="px-3 py-1.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold active:scale-95 transition-all"
          >
            สลับผู้ใช้
          </button>
        </div>
      </div>

      {/* Google Sheets Connection Section */}
      <div className="glass-panel rounded-3xl p-4.5 shadow-cute border border-white/80 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-navy-text">การเชื่อมต่อ Google Sheets</h3>
            <p className="text-[10px] text-navy-muted">แหล่งเก็บข้อมูลหลักของระบบ “จดให้ไว”</p>
          </div>
        </div>

        {/* Read-only Spreadsheet ID */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500">Spreadsheet ID:</span>
            <span className="font-mono text-[10px] text-navy-text font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
              {DEFAULT_SPREADSHEET_ID}
            </span>
          </div>
          <a
            href={DEFAULT_SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-sky-600 font-bold hover:underline flex items-center gap-1 mt-1"
          >
            <span>เปิดดูไฟล์ Google Sheets ในแท็บใหม่</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Google Apps Script Web App URL */}
        <div>
          <label className="block text-[11px] font-bold text-navy-text mb-1">
            Google Apps Script Web App URL (สำหรับซิงก์ข้อมูลสองทาง)
          </label>
          <input
            type="text"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={gasUrl}
            onChange={(e) => setGasUrl(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-navy-text focus:outline-none focus:border-sky-400"
          />
          <p className="text-[10px] text-navy-muted mt-1">
            *โค้ดพร้อมใช้งานอยู่ในโฟลเดอร์ <code>google-apps-script/Code.gs</code>
          </p>
        </div>

        {/* Test Connection Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingStatus?.testing}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-cute flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingStatus?.testing ? 'animate-spin' : ''}`} />
            <span>{testingStatus?.testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อจริง'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConfigs}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-cute active:scale-98 transition-all"
          >
            บันทึก URL
          </button>
        </div>

        {savedNotice && (
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
          </p>
        )}

        {/* Test Connection Result Box */}
        {testingStatus && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold border ${
              testingStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testingStatus.success ? '✅' : '❌'} {testingStatus.message}
          </div>
        )}
      </div>

      {/* Gemini AI API Key Section */}
      <div className="glass-panel rounded-3xl p-4.5 shadow-cute border border-white/80 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-navy-text">Gemini AI API Key (ทางเลือก)</h3>
            <p className="text-[10px] text-navy-muted">สำหรับยกระดับผู้ช่วย AI "น้องจด"</p>
          </div>
        </div>

        <input
          type="password"
          placeholder="AIzaSy..."
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          className="w-full text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-navy-text focus:outline-none focus:border-purple-400"
        />
        <p className="text-[10px] text-navy-muted">
          *หากไม่ระบุ น้องจดจะใช้ระบบวิเคราะห์ข้อมูลภายในระบบอย่างชาญฉลาดและปลอดภัยโดยอัตโนมัติ
        </p>
      </div>

      {/* Theme & Notifications */}
      <div className="glass-panel rounded-3xl p-4 shadow-cute border border-white/80 space-y-2">
        <button
          onClick={onOpenThemeModal}
          className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between border border-transparent hover:border-slate-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Palette className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-navy-text">เปลี่ยนธีมสี (Theme)</p>
              <p className="text-[10px] text-navy-muted">ธีมปัจจุบัน: {settings.selected_theme}</p>
            </div>
          </div>
          <span className="text-xs text-sky-600 font-bold">เลือก &gt;</span>
        </button>

        <div className="p-3 rounded-2xl flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-text">การแจ้งเตือนงบประมาณ</p>
              <p className="text-[10px] text-navy-muted">เตือนเมื่อใกล้ถึงและเกินงบประมาณ</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications_enabled}
            onChange={(e) => onUpdateSettings({ notifications_enabled: e.target.checked })}
            className="w-5 h-5 accent-sky-500 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
