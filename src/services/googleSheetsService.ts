import { Transaction, HealthRecord, Budget, Account, AppSettings, Category } from '../types';

export const DEFAULT_SPREADSHEET_ID = '10nzaDw3TWBgFp12jHwMfjY4ajFaLaU0k6PDWO8RpMcE';
export const DEFAULT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`;

const STORAGE_KEYS = {
  TRANSACTIONS: 'mruengjod_transactions_v2',
  HEALTH_RECORDS: 'mruengjod_health_v2',
  BUDGETS: 'mruengjod_budgets_v2',
  ACCOUNTS: 'mruengjod_accounts_v2',
  SETTINGS: 'mruengjod_settings_v2',
  CATEGORIES: 'mruengjod_categories_v2',
  LAST_FETCH: 'mruengjod_last_fetch_v2',
};

// Default Categories with cute icons and pastel colors
export const DEFAULT_CATEGORIES: Category[] = [
  { category_id: 'cat-food', category_name: 'อาหารและเครื่องดื่ม', transaction_type: 'expense', icon: 'Utensils', color: '#F87171' },
  { category_id: 'cat-market', category_name: 'ซื้อของเข้าบ้าน / ตลาด', transaction_type: 'expense', icon: 'ShoppingCart', color: '#FB923C' },
  { category_id: 'cat-convenience', category_name: '7-Eleven / CJ', transaction_type: 'expense', icon: 'Store', color: '#FBBF24' },
  { category_id: 'cat-fuel', category_name: 'เติมน้ำมัน / เดินทาง', transaction_type: 'expense', icon: 'Car', color: '#60A5FA' },
  { category_id: 'cat-car-insurance', category_name: 'ค่าประกันรถยนต์', transaction_type: 'expense', icon: 'Shield', color: '#6366F1' },
  { category_id: 'cat-health', category_name: 'ค่าสุขภาพ', transaction_type: 'expense', icon: 'Activity', color: '#10B981' },
  { category_id: 'cat-laundry', category_name: 'ค่าซัก-อบผ้า / งานบ้าน', transaction_type: 'expense', icon: 'Shirt', color: '#A78BFA' },
  { category_id: 'cat-cafe', category_name: 'คาเฟ่ & ขนม', transaction_type: 'expense', icon: 'Coffee', color: '#F472B6' },
  { category_id: 'cat-bills', category_name: 'ค่าน้ำ-ไฟ-อินเทอร์เน็ต', transaction_type: 'expense', icon: 'Zap', color: '#38BDF8' },
  { category_id: 'cat-medical', category_name: 'ยา & รักษาพยาบาล', transaction_type: 'expense', icon: 'HeartPulse', color: '#EC4899' },
  { category_id: 'cat-salary', category_name: 'เงินเดือน / ค่าจ้าง', transaction_type: 'income', icon: 'Coins', color: '#34D399' },
  { category_id: 'cat-couple-deposit', category_name: 'รับเงินคู่รายเดือน', transaction_type: 'income', icon: 'HeartHandshake', color: '#10B981' },
  { category_id: 'cat-bonus', category_name: 'โบนัส / ของขวัญ', transaction_type: 'income', icon: 'Gift', color: '#6EE7B7' },
  { category_id: 'cat-other-income', category_name: 'รายรับอื่นๆ', transaction_type: 'income', icon: 'ArrowDownCircle', color: '#2DD4BF' },
  { category_id: 'cat-other-expense', category_name: 'รายจ่ายอื่นๆ', transaction_type: 'expense', icon: 'MoreHorizontal', color: '#94A3B8' },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { account_id: 'acc-couple-main', user_id: 'couple-1', account_name: 'เงินคู่รายเดือน (Jo-Tanz)', account_type: 'bank', bank_name: 'กสิกรไทย (KBank)', account_number_masked: 'xxx-x-xx123-4', display_balance: 52680.50, balance_source: 'manual', last_synced_at: new Date().toISOString(), connection_status: 'connected' },
  { account_id: 'acc-jo-personal', user_id: 'user-jo', account_name: 'บัญชีส่วนตัว (โจ)', account_type: 'bank', bank_name: 'ไทยพาณิชย์ (SCB)', account_number_masked: 'xxx-x-xx890-1', display_balance: 24500.00, balance_source: 'manual', last_synced_at: new Date().toISOString(), connection_status: 'connected' },
  { account_id: 'acc-tanz-personal', user_id: 'user-tanz', account_name: 'บัญชีส่วนตัว (ตาล)', account_type: 'bank', bank_name: 'กรุงศรี (BAY)', account_number_masked: 'xxx-x-xx456-7', display_balance: 18900.00, balance_source: 'manual', last_synced_at: new Date().toISOString(), connection_status: 'connected' },
  { account_id: 'acc-savings', user_id: 'couple-1', account_name: 'เงินออมคู่เพื่ออนาคต', account_type: 'bank', bank_name: 'เกียรตินาคินภัทร (KKP)', account_number_masked: 'xxx-x-xx999-0', display_balance: 150000.00, balance_source: 'manual', last_synced_at: new Date().toISOString(), connection_status: 'connected' },
];

export const DEFAULT_BUDGETS: Budget[] = [
  { budget_id: 'b-month-total', couple_id: 'couple-1', category_id: 'all', category_name: 'งบประมาณรวมรายเดือน', budget_amount: 30000, start_date: '2026-10-01', end_date: '2026-10-31', alert_percentage: 80 },
  { budget_id: 'b-food', couple_id: 'couple-1', category_id: 'cat-food', category_name: 'อาหารและเครื่องดื่ม', budget_amount: 10000, start_date: '2026-10-01', end_date: '2026-10-31', alert_percentage: 80 },
  { budget_id: 'b-market', couple_id: 'couple-1', category_id: 'cat-market', category_name: 'ซื้อของเข้าบ้าน / ตลาด', budget_amount: 6000, start_date: '2026-10-01', end_date: '2026-10-31', alert_percentage: 85 },
  { budget_id: 'b-convenience', couple_id: 'couple-1', category_id: 'cat-convenience', category_name: '7-Eleven / CJ', budget_amount: 3000, start_date: '2026-10-01', end_date: '2026-10-31', alert_percentage: 80 },
  { budget_id: 'b-fuel', couple_id: 'couple-1', category_id: 'cat-fuel', category_name: 'เติมน้ำมัน / เดินทาง', budget_amount: 4000, start_date: '2026-10-01', end_date: '2026-10-31', alert_percentage: 80 },
];

export const DEFAULT_GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwGyEKYwuTnZ0tIkcbpeGLWwX7tAVBdnrgnr_-dz_R4Pf-L48cLrRIfhjqNOnkGBSW6/exec';

export const DEFAULT_SETTINGS: AppSettings = {
  user_id: 'user-jo',
  selected_theme: 'sky',
  language: 'th',
  notifications_enabled: true,
  notify_budget_near: true,
  notify_budget_exceeded: true,
  notify_daily_reminder: true,
  gas_webapp_url: DEFAULT_GAS_WEBAPP_URL,
  spreadsheet_id: DEFAULT_SPREADSHEET_ID,
  gemini_api_key: '',
  hide_wallet_balance: false,
  updated_at: new Date().toISOString()
};

// CSV Line Parser handling quotes
function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  const result: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const row: string[] = [];
    let inQuotes = false;
    let current = '';
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);
    result.push(row);
  }
  return result;
}

export class GoogleSheetsService {
  private static parseExistingDate(dStr: string): string {
    if (!dStr) return new Date().toISOString();
    const trimmed = dStr.trim();
    // 1. If DD/MM/YYYY or DD/MM/YYYY HH:mm or DD/MM/YYYY H:mm:ss
    if (trimmed.includes('/')) {
      const [dPart, tPart] = trimmed.split(' ');
      const parts = dPart.split('/');
      if (parts.length === 3) {
        let [d, m, y] = parts;
        if (parseInt(y, 10) > 2500) y = (parseInt(y, 10) - 543).toString();
        const timeParts = tPart ? tPart.split(':') : ['12', '00', '00'];
        const h = timeParts[0].padStart(2, '0');
        const min = (timeParts[1] || '00').padStart(2, '0');
        const s = (timeParts[2] || '00').padStart(2, '0');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h}:${min}:${s}`;
      }
    }
    // 2. If YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
    if (trimmed.includes('-')) {
      if (trimmed.includes(' ')) {
        const [dPart, tPart] = trimmed.split(' ');
        const timeParts = tPart ? tPart.split(':') : ['12', '00', '00'];
        const h = timeParts[0].padStart(2, '0');
        const min = (timeParts[1] || '00').padStart(2, '0');
        const s = (timeParts[2] || '00').padStart(2, '0');
        return `${dPart}T${h}:${min}:${s}`;
      }
      if (trimmed.includes('T')) return trimmed;
      return `${trimmed}T12:00:00`;
    }
    const d = new Date(trimmed);
    return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  }

  /**
   * Fetch live data directly from Google Sheets public export
   */
  static async fetchFromGoogleSheets(): Promise<{ transactions: Transaction[], healthRecords: HealthRecord[] }> {
    const url = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ไม่สามารถดาวน์โหลดข้อมูลจาก Google Sheets (HTTP ${response.status})`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return { transactions: [], healthRecords: [] };
    }

    const transactions: Transaction[] = [];
    const healthRecords: HealthRecord[] = [];

    // Header: ID, วันที่, บัญชี, ประเภท, หมวดหมู่, รายละเอียดเพิ่มเติม, จำนวนเงิน
    const dataRows = rows.slice(1);
    for (const row of dataRows) {
      if (row.length < 5) continue;
      const [id, dateStr, account, type, category, desc, amountStr] = row;
      const amount = parseFloat(amountStr) || 0;
      const parsedDate = this.parseExistingDate(dateStr);

      if (account === 'น้ำหนัก' || category === 'น้ำหนักรายวัน') {
        // Health record
        const userName = (type === 'ตาล' || type === 'โจ') ? type : 'โจ';
        const height = userName === 'โจ' ? 175 : 160;
        const bmi = parseFloat((amount / Math.pow(height / 100, 2)).toFixed(1));
        healthRecords.push({
          health_id: id || `WT-${Date.now()}-${Math.random()}`,
          user_id: userName === 'ตาล' ? 'user-tanz' : 'user-jo',
          user_name: userName,
          record_date: dateStr.split(' ')[0],
          weight_kg: amount,
          height_cm: height,
          bmi: bmi,
          note: desc || '',
          created_at: parsedDate
        });
      } else {
        // Finance transaction
        const isIncome = type === 'รายรับ' || type === 'income';
        const isExpense = type === 'รายจ่าย' || type === 'expense';
        if (!isIncome && !isExpense) continue;

        transactions.push({
          transaction_id: id || `TX-${Date.now()}-${Math.random()}`,
          couple_id: 'couple-1',
          user_id: account.includes('ตาล') ? 'user-tanz' : 'user-jo',
          user_name: account.includes('ตาล') ? 'ตาล' : 'โจ',
          transaction_date: parsedDate,
          transaction_type: isIncome ? 'income' : 'expense',
          category: category || (isIncome ? 'รายรับอื่นๆ' : 'รายจ่ายอื่นๆ'),
          description: desc || category || '',
          amount: Math.abs(amount),
          account_id: account || 'เงินคู่รายเดือน',
          created_at: parsedDate,
          updated_at: parsedDate
        });
      }
    }

    // Sort descending by date
    transactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    healthRecords.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());

    return { transactions, healthRecords };
  }

  /**
   * Test Connection to Google Sheets or Web App
   */
  static async testConnection(webAppUrl?: string): Promise<{ success: boolean; message: string; rowCount?: number; latencyMs?: number }> {
    const start = performance.now();
    try {
      if (webAppUrl && webAppUrl.trim().length > 0) {
        // Test Google Apps Script Web App
        const cleanUrl = webAppUrl.trim() + (webAppUrl.includes('?') ? '&' : '?') + 'action=testConnection';
        const res = await fetch(cleanUrl, { method: 'GET' });
        const latency = Math.round(performance.now() - start);
        if (!res.ok) {
          return { success: false, message: `Apps Script ตอบกลับสถานะ ${res.status}: ${res.statusText}`, latencyMs: latency };
        }
        const data = await res.json();
        return {
          success: true,
          message: `เชื่อมต่อ Apps Script สำเร็จ! (${data.spreadsheetTitle || 'จดให้ไว'} - ${data.sheets?.length || 0} ชีต)`,
          latencyMs: latency
        };
      } else {
        // Test Google Sheet CSV Export Endpoint
        const url = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
        const res = await fetch(url);
        const latency = Math.round(performance.now() - start);
        if (!res.ok) {
          return { success: false, message: `ไม่สามารถเปิด Google Sheet ID ที่ระบุได้ (HTTP ${res.status})`, latencyMs: latency };
        }
        const text = await res.text();
        const rowCount = text.split('\n').length;
        return {
          success: true,
          message: `เชื่อมต่อ Google Sheet ID: ${DEFAULT_SPREADSHEET_ID} สำเร็จ! พบข้อมูลทั้งหมด ${rowCount} แถว`,
          rowCount: rowCount,
          latencyMs: latency
        };
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      return {
        success: false,
        message: `ข้อผิดพลาดการเชื่อมต่อ: ${err.message || 'Network error หรือติด CORS'}`,
        latencyMs: latency
      };
    }
  }

  /**
   * Sync new transaction to Google Apps Script Web App if available
   */
  static async syncTransactionToCloud(webAppUrl: string, transaction: Transaction): Promise<{ success: boolean; error?: string }> {
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      return { success: true }; // LocalStorage only mode
    }

    try {
      const res = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'addTransaction',
          data: transaction
        })
      });
      const data = await res.json();
      return { success: data.success, error: data.error };
    } catch (e: any) {
      console.warn('Could not sync transaction to Web App, stored locally:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Sync new health record to Google Apps Script Web App
   */
  static async syncHealthRecordToCloud(webAppUrl: string, record: HealthRecord): Promise<{ success: boolean; error?: string }> {
    if (!webAppUrl || !webAppUrl.startsWith('http')) {
      return { success: true };
    }

    try {
      const res = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'addHealthRecord',
          data: record
        })
      });
      const data = await res.json();
      return { success: data.success, error: data.error };
    } catch (e: any) {
      console.warn('Could not sync health record to Web App, stored locally:', e);
      return { success: false, error: e.message };
    }
  }

  // Local Storage getters & setters
  static getLocalTransactions(): Transaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((t): t is Transaction => !!t && typeof t === 'object').map((t) => ({
        ...t,
        amount: Number(t.amount) || 0,
        category: t.category || 'รายจ่ายอื่นๆ',
        description: t.description || '',
        transaction_date: t.transaction_date || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }

  static setLocalTransactions(txs: Transaction[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    } catch (e) {
      console.warn('Failed to save local transactions:', e);
    }
  }

  static getLocalHealthRecords(): HealthRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  static setLocalHealthRecords(records: HealthRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save local health records:', e);
    }
  }

  static getLocalBudgets(): Budget[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!raw) return DEFAULT_BUDGETS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BUDGETS;
    } catch {
      return DEFAULT_BUDGETS;
    }
  }

  static setLocalBudgets(budgets: Budget[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.warn('Failed to save local budgets:', e);
    }
  }

  static getLocalAccounts(): Account[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!raw) return DEFAULT_ACCOUNTS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  }

  static setLocalAccounts(accs: Account[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accs));
    } catch (e) {
      console.warn('Failed to save local accounts:', e);
    }
  }

  static getLocalSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        gas_webapp_url: parsed.gas_webapp_url && parsed.gas_webapp_url.trim().length > 0
          ? parsed.gas_webapp_url
          : DEFAULT_GAS_WEBAPP_URL
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static setLocalSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getLocalCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return DEFAULT_CATEGORIES;
    try {
      const parsed: Category[] = JSON.parse(raw);
      // Ensure any newly added DEFAULT_CATEGORIES are present in existing cache
      const existingNames = new Set(parsed.map((c) => c.category_name));
      const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.category_name));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  static setLocalCategories(cats: Category[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  }
}
