import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { SummaryAnalyticsView } from './components/SummaryAnalyticsView';
import { SettingsView } from './components/SettingsView';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { ThemeModal } from './components/ThemeModal';
import { RecordTransactionModal } from './components/RecordTransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { WalletModal } from './components/WalletModal';
import { HealthTrackerModal } from './components/HealthTrackerModal';
import { SlipScannerModal } from './components/SlipScannerModal';
import { AIAgentDrawer } from './components/AIAgentDrawer';

import { 
  GoogleSheetsService, 
  DEFAULT_CATEGORIES, 
  DEFAULT_BUDGETS, 
  DEFAULT_ACCOUNTS, 
  DEFAULT_SETTINGS 
} from './services/googleSheetsService';
import { Transaction, HealthRecord, Budget, Account, AppSettings, Category, ThemeKey } from './types';
import { RefreshCw, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Global States
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [currentUser, setCurrentUser] = useState<string>('โจ');
  const [settings, setSettings] = useState<AppSettings>(() => GoogleSheetsService.getLocalSettings());
  const [transactions, setTransactions] = useState<Transaction[]>(() => GoogleSheetsService.getLocalTransactions());
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(() => GoogleSheetsService.getLocalHealthRecords());
  const [budgets, setBudgets] = useState<Budget[]>(() => GoogleSheetsService.getLocalBudgets());
  const [accounts, setAccounts] = useState<Account[]>(() => GoogleSheetsService.getLocalAccounts());
  const [categories, setCategories] = useState<Category[]>(() => GoogleSheetsService.getLocalCategories());

  // Loading & Sync state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('ซิงก์ข้อมูลแล้ว');

  // Modals
  const [themeModalOpen, setThemeModalOpen] = useState<boolean>(false);
  const [recordModalOpen, setRecordModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [healthModalOpen, setHealthModalOpen] = useState<boolean>(false);
  const [ocrModalOpen, setOcrModalOpen] = useState<boolean>(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(false);

  // Initial Fetch from Google Sheets on Mount
  useEffect(() => {
    const initData = async () => {
      // If transactions are empty, fetch live from Google Sheets
      if (transactions.length === 0) {
        setIsLoading(true);
        try {
          const liveData = await GoogleSheetsService.fetchFromGoogleSheets();
          if (liveData.transactions.length > 0) {
            setTransactions(liveData.transactions);
            GoogleSheetsService.setLocalTransactions(liveData.transactions);
          }
          if (liveData.healthRecords.length > 0) {
            setHealthRecords(liveData.healthRecords);
            GoogleSheetsService.setLocalHealthRecords(liveData.healthRecords);
          }
          setSyncStatusText(`โหลดข้อมูลชีตสำเร็จ (${liveData.transactions.length} รายการ)`);
        } catch (err) {
          console.warn('Initial Google Sheet fetch error:', err);
          setSyncStatusText('ทำงานในโหมดออฟไลน์');
        } finally {
          setIsLoading(false);
        }
      }
    };
    initData();
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    GoogleSheetsService.setLocalTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    GoogleSheetsService.setLocalHealthRecords(healthRecords);
  }, [healthRecords]);

  useEffect(() => {
    GoogleSheetsService.setLocalBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    GoogleSheetsService.setLocalAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    GoogleSheetsService.setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    GoogleSheetsService.setLocalCategories(categories);
  }, [categories]);

  // Synchronize theme with <html>, <body>, and meta theme-color
  useEffect(() => {
    const themeClass = `theme-${settings.selected_theme}`;
    document.documentElement.className = themeClass;
    document.body.className = `font-prompt antialiased text-navy-text selection:bg-sky-200 ${themeClass}`;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const colorMap: Record<string, string> = {
      sky: '#7DD3FC',
      pink: '#F472B6',
      lavender: '#C084FC',
      mint: '#34D399',
      sunshine: '#FBBF24',
      night: '#0F172A',
    };
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', colorMap[settings.selected_theme] || '#7DD3FC');
    }
  }, [settings.selected_theme]);

  // Refresh live from Google Sheets
  const handleRefreshFromSheet = async () => {
    setIsLoading(true);
    setSyncStatusText('กำลังดึงข้อมูลล่าสุด...');
    try {
      const liveData = await GoogleSheetsService.fetchFromGoogleSheets();
      if (liveData.transactions.length > 0) {
        setTransactions(liveData.transactions);
        GoogleSheetsService.setLocalTransactions(liveData.transactions);
      }
      if (liveData.healthRecords.length > 0) {
        setHealthRecords(liveData.healthRecords);
        GoogleSheetsService.setLocalHealthRecords(liveData.healthRecords);
      }
      setSyncStatusText(`ซิงก์สำเร็จ! พบ ${liveData.transactions.length} รายการ`);
    } catch (err: any) {
      setSyncStatusText(`ซิงก์ไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle user between โจ and ตาล
  const handleToggleUser = () => {
    setCurrentUser((prev) => (prev === 'โจ' ? 'ตาล' : 'โจ'));
  };

  // Handle Select Theme
  const handleSelectTheme = (newTheme: ThemeKey) => {
    const updated = { ...settings, selected_theme: newTheme, updated_at: new Date().toISOString() };
    setSettings(updated);
    GoogleSheetsService.setLocalSettings(updated);
  };

  // Save or Update Transaction
  const handleSaveTransaction = async (txData: Partial<Transaction>) => {
    if (txData.transaction_id) {
      // Edit existing
      setTransactions((prev) =>
        prev.map((t) => (t.transaction_id === txData.transaction_id ? ({ ...t, ...txData } as Transaction) : t))
      );
    } else {
      // New transaction
      const newTx: Transaction = {
        transaction_id: `TX-${Date.now()}`,
        couple_id: 'couple-1',
        user_id: currentUser === 'ตาล' ? 'user-tanz' : 'user-jo',
        user_name: currentUser,
        transaction_date: txData.transaction_date || new Date().toISOString(),
        transaction_type: txData.transaction_type || 'expense',
        category: txData.category || 'อาหารและเครื่องดื่ม',
        description: txData.description || txData.category || '',
        amount: txData.amount || 0,
        account_id: txData.account_id || 'เงินคู่รายเดือน',
        note: txData.note,
        receipt_image: txData.receipt_image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev]);

      // Cloud sync if WebApp URL is configured
      if (settings.gas_webapp_url) {
        GoogleSheetsService.syncTransactionToCloud(settings.gas_webapp_url, newTx);
      }
    }
    setEditingTransaction(null);
  };

  // Delete Transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    setTransactions((prev) => prev.filter((t) => t.transaction_id !== transactionId));
    setEditingTransaction(null);
  };

  // Save Health Record
  const handleSaveHealthRecord = async (record: HealthRecord) => {
    setHealthRecords((prev) => [record, ...prev]);
    if (settings.gas_webapp_url) {
      GoogleSheetsService.syncHealthRecordToCloud(settings.gas_webapp_url, record);
    }
  };

  // Save Budget
  const handleSaveBudget = (b: Budget) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((item) => item.budget_id === b.budget_id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = b;
        return copy;
      }
      return [...prev, b];
    });
  };

  // Update Account Balance
  const handleUpdateBalance = (accountId: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((a) => (a.account_id === accountId ? { ...a, display_balance: newBalance, last_synced_at: new Date().toISOString() } : a))
    );
  };

  // Reset Data to fresh Google Sheet sync
  const handleResetData = async () => {
    localStorage.clear();
    setTransactions([]);
    setHealthRecords([]);
    setBudgets(DEFAULT_BUDGETS);
    setAccounts(DEFAULT_ACCOUNTS);
    setCategories(DEFAULT_CATEGORIES);
    setSettings(DEFAULT_SETTINGS);
    await handleRefreshFromSheet();
  };

  return (
    <div className={`theme-${settings.selected_theme} min-h-screen text-navy-text relative selection:bg-sky-200 transition-colors duration-500`}>
      {/* Background Graphic - Sky theme clouds */}
      {settings.selected_theme === 'sky' && (
        <div 
          className="fixed inset-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-35 z-0 transition-opacity duration-500"
          style={{ backgroundImage: `url('./assets/bg-sky.png')` }}
        />
      )}
      {/* Dynamic Theme Gradient Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-500"
        style={{ background: 'var(--theme-bg-gradient)' }}
      />

      {/* Mobile Wrapper */}
      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col justify-between shadow-2xl bg-white/20 sm:border-x sm:border-white/50 backdrop-blur-[2px]">
        {/* Main App Content */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <Header
            onOpenThemeModal={() => setThemeModalOpen(true)}
            currentUser={currentUser}
            onToggleUser={handleToggleUser}
          />

          {/* Sync indicator bar */}
          <div className="px-4 py-1 flex items-center justify-between text-[10px] text-navy-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{syncStatusText}</span>
            </span>
            <button
              onClick={handleRefreshFromSheet}
              disabled={isLoading}
              className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-bold active:scale-95 transition-all"
              title="ดึงข้อมูลล่าสุดจาก Google Sheets"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>ซิงก์ชีต</span>
            </button>
          </div>

          {/* Tab Views */}
          <div className="flex-1 mt-1">
            {currentTab === 'home' && (
              <HomeDashboard
                transactions={transactions}
                onOpenRecord={() => {
                  setEditingTransaction(null);
                  setRecordModalOpen(true);
                }}
                onOpenWallet={() => setWalletModalOpen(true)}
                onOpenHealth={() => setHealthModalOpen(true)}
                onOpenOCR={() => setOcrModalOpen(true)}
                onOpenBudget={() => setBudgetModalOpen(true)}
                onNavigateToSummary={() => setCurrentTab('summary')}
                onSelectTransaction={(t) => {
                  setEditingTransaction(t);
                  setRecordModalOpen(true);
                }}
              />
            )}

            {currentTab === 'summary' && (
              <SummaryAnalyticsView
                transactions={transactions}
                budgets={budgets}
                onBackToHome={() => setCurrentTab('home')}
                onSelectTransaction={(t) => {
                  setEditingTransaction(t);
                  setRecordModalOpen(true);
                }}
              />
            )}

            {currentTab === 'health' && (
              <div className="p-3 sm:p-4 pb-28">
                <HealthTrackerModal
                  isOpen={true}
                  isInline={true}
                  onClose={() => setCurrentTab('home')}
                  healthRecords={healthRecords}
                  currentUser={currentUser}
                  onSaveHealthRecord={handleSaveHealthRecord}
                />
              </div>
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                currentUser={currentUser}
                onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
                onOpenThemeModal={() => setThemeModalOpen(true)}
                onToggleUser={handleToggleUser}
                onResetData={handleResetData}
              />
            )}
          </div>
        </main>

        {/* FLOATING AI AGENT BUTTON "น้องจด" */}
        <div className="fixed bottom-24 z-40 right-4 sm:right-auto sm:left-1/2 sm:translate-x-[150px]">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="group relative flex items-center justify-center active:scale-95 transition-all"
            title="คุยกับผู้ช่วย AI น้องจด"
          >
            {/* Cute speech bubble tip */}
            <div className="absolute -top-7 right-0 bg-white/95 text-navy-text text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-cute border border-sky-200 whitespace-nowrap pointer-events-none flex items-center gap-1 group-hover:scale-105 transition-transform">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span>น้องจดพร้อมช่วยค่ะ 💕</span>
            </div>

            {/* Mascot Button */}
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-cute-lg bg-white/95 hover:shadow-glow-primary transition-all p-0.5 animate-bounce">
              <img
                src="./assets/nong-jod.png"
                alt="Nong Jod"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>

        {/* BOTTOM NAVIGATION */}
        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenRecord={() => {
            setEditingTransaction(null);
            setRecordModalOpen(true);
          }}
        />

        {/* MODALS */}
        <ThemeModal
          isOpen={themeModalOpen}
          onClose={() => setThemeModalOpen(false)}
          currentTheme={settings.selected_theme}
          onSelectTheme={handleSelectTheme}
        />

        <RecordTransactionModal
          isOpen={recordModalOpen}
          onClose={() => {
            setRecordModalOpen(false);
            setEditingTransaction(null);
          }}
          categories={categories}
          accounts={accounts}
          currentUser={currentUser}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          editingTransaction={editingTransaction}
        />

        <BudgetModal
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          budgets={budgets}
          categories={categories}
          transactions={transactions}
          onSaveBudget={handleSaveBudget}
          onDeleteBudget={(id) => setBudgets((prev) => prev.filter((b) => b.budget_id !== id))}
        />

        <WalletModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          accounts={accounts}
          onUpdateBalance={handleUpdateBalance}
        />

        {currentTab !== 'health' && (
          <HealthTrackerModal
            isOpen={healthModalOpen}
            onClose={() => setHealthModalOpen(false)}
            healthRecords={healthRecords}
            currentUser={currentUser}
            onSaveHealthRecord={handleSaveHealthRecord}
          />
        )}

        <SlipScannerModal
          isOpen={ocrModalOpen}
          onClose={() => setOcrModalOpen(false)}
          categories={categories}
          accounts={accounts}
          existingTransactions={transactions}
          currentUser={currentUser}
          geminiApiKey={settings.gemini_api_key}
          onConfirmTransaction={handleSaveTransaction}
        />

        <AIAgentDrawer
          isOpen={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          transactions={transactions}
          healthRecords={healthRecords}
          budgets={budgets}
          currentUser={currentUser}
          geminiApiKey={settings.gemini_api_key}
          accounts={accounts}
          settings={settings}
          categories={categories}
          onOpenRecord={() => {
            setAiDrawerOpen(false);
            setRecordModalOpen(true);
          }}
          onOpenHealth={() => {
            setAiDrawerOpen(false);
            setCurrentTab('health');
          }}
          onOpenBudget={() => {
            setAiDrawerOpen(false);
            setBudgetModalOpen(true);
          }}
          onOpenWallet={() => {
            setAiDrawerOpen(false);
            setWalletModalOpen(true);
          }}
          onOpenSummary={() => {
            setAiDrawerOpen(false);
            setCurrentTab('summary');
          }}
          onOpenOCR={() => {
            setAiDrawerOpen(false);
            setOcrModalOpen(true);
          }}
          onOpenTheme={() => {
            setAiDrawerOpen(false);
            setThemeModalOpen(true);
          }}
        />
      </div>
    </div>
  );
};
export default App;
