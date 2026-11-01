export type TransactionType = 'income' | 'expense';

export interface User {
  user_id: string;
  display_name: string;
  email: string;
  couple_id: string;
  role: 'owner' | 'partner';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  couple_id: string;
  couple_name: string;
  created_by: string;
  created_at: string;
  status: 'active' | 'pending';
}

export interface CoupleMember {
  membership_id: string;
  couple_id: string;
  user_id: string;
  role: 'owner' | 'partner';
  joined_at: string;
  status: 'active';
}

export interface Transaction {
  transaction_id: string;
  couple_id: string;
  user_id: string;
  user_name?: string;
  transaction_date: string; // ISO string or YYYY-MM-DD HH:mm
  transaction_type: TransactionType;
  category: string;
  description: string;
  amount: number; // In THB decimal
  account_id: string;
  receipt_id?: string;
  receipt_image?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  transaction_type: TransactionType;
  icon: string;
  color: string;
}

export interface Budget {
  budget_id: string;
  couple_id: string;
  category_id: string; // 'all' or specific category_id
  category_name: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  alert_percentage: number; // e.g. 80
}

export interface HealthRecord {
  health_id: string;
  user_id: string;
  user_name: string;
  record_date: string; // YYYY-MM-DD
  weight_kg: number;
  height_cm: number;
  bmi: number;
  note?: string;
  created_at: string;
}

export interface Account {
  account_id: string;
  user_id: string;
  account_name: string;
  account_type: 'bank' | 'wallet' | 'cash';
  bank_name?: string;
  account_number_masked?: string;
  display_balance: number;
  balance_source: 'manual' | 'open_banking_api';
  last_synced_at: string;
  connection_status: 'connected' | 'manual_only' | 'disconnected';
}

export interface ReceiptScan {
  receipt_id: string;
  user_id: string;
  file_reference: string;
  detected_amount?: number;
  detected_date?: string;
  detected_description?: string;
  detected_category?: string;
  scan_status: 'pending' | 'reviewed' | 'saved' | 'failed';
  transaction_id?: string;
}

export type ThemeKey = 'sky' | 'pink' | 'lavender' | 'mint' | 'sunshine' | 'night';

export interface AppSettings {
  user_id: string;
  selected_theme: ThemeKey;
  language: 'th' | 'en';
  notifications_enabled: boolean;
  notify_budget_near: boolean;
  notify_budget_exceeded: boolean;
  notify_daily_reminder: boolean;
  gas_webapp_url: string; // Google Apps Script Web App URL
  spreadsheet_id: string;
  gemini_api_key?: string;
  hide_wallet_balance: boolean;
  updated_at: string;
}

export interface AuditLog {
  log_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  metadata?: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'nong-jod';
  text: string;
  timestamp: string;
  actionProposal?: {
    type: 'transaction' | 'health';
    data: Partial<Transaction> | Partial<HealthRecord>;
    confirmed?: boolean;
  };
  actionLink?: {
    action: 'record' | 'health' | 'budget' | 'wallet' | 'summary' | 'ocr' | 'voice' | 'theme';
    label: string;
  };
}

export type AccountFilterType = 'couple' | 'personal' | 'all';

export const isCoupleTransaction = (t?: { account_id?: string; account_name?: string } | null): boolean => {
  if (!t) return true;
  const acc = (t.account_id || t.account_name || '').trim().toLowerCase();
  if (
    acc.includes('personal') || 
    acc.includes('ส่วนตัว') || 
    acc.includes('รายจ่ายโจ') || 
    (acc.includes('รายจ่าย') && acc.includes('จ'))
  ) {
    return false;
  }
  return true;
};

