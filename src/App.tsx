/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FamilyMember, 
  ExpenseCategory, 
  ExpenseTicket, 
  SheetConfig, 
  ProposedImprovement,
  HouseholdFinancialPlan 
} from './types/expense';
import { 
  INITIAL_FAMILY_MEMBERS, 
  INITIAL_CATEGORIES, 
  INITIAL_TICKETS, 
  INITIAL_SHEET_CONFIG, 
  PROPOSED_IMPROVEMENTS,
  INITIAL_FINANCIAL_PLAN 
} from './data/initialData';
import { HeaderNav } from './components/HeaderNav';
import { DashboardOverview } from './components/DashboardOverview';
import { SpendingView } from './components/SpendingView';
import { TicketAuditView } from './components/TicketAuditView';
import { FamilySplitsView } from './components/FamilySplitsView';
import { ImprovementsView } from './components/ImprovementsView';
import { SheetsPipelineView } from './components/SheetsPipelineView';
import { AddTicketModal } from './components/AddTicketModal';
import { ConfirmSheetUpdateModal } from './components/ConfirmSheetUpdateModal';
import { BudgetSettingsModal } from './components/BudgetSettingsModal';
import { FamilySourcesSettingsModal } from './components/FamilySourcesSettingsModal';
import { BottomNavBar } from './components/BottomNavBar';
import { CheckCircle2, Smartphone, Monitor, Wifi, Battery, Signal, Camera } from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getCachedAccessToken 
} from './services/googleAuth';
import { updateSheetCell } from './services/googleSheets';

export default function App() {
  // Mobile-first mode state: defaults to true so mobile layout is immediately visible!
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('family_ledger_mobile_mode');
    if (saved !== null) return saved === 'true';
    return true; // Default to mobile-first phone app view
  });

  useEffect(() => {
    localStorage.setItem('family_ledger_mobile_mode', String(isMobileMode));
  }, [isMobileMode]);

  // Local storage backed state
  const [tickets, setTickets] = useState<ExpenseTicket[]>(() => {
    const saved = localStorage.getItem('family_ledger_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TICKETS;
      }
    }
    return INITIAL_TICKETS;
  });

  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem('family_ledger_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_CATEGORIES;
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [financialPlan, setFinancialPlan] = useState<HouseholdFinancialPlan>(() => {
    const saved = localStorage.getItem('family_ledger_financial_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_FINANCIAL_PLAN;
      }
    }
    return INITIAL_FINANCIAL_PLAN;
  });

  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem('family_ledger_members');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_FAMILY_MEMBERS;
      }
    }
    return INITIAL_FAMILY_MEMBERS;
  });

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = localStorage.getItem('family_ledger_sheet_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SHEET_CONFIG;
      }
    }
    return INITIAL_SHEET_CONFIG;
  });

  const [improvements] = useState<ProposedImprovement[]>(PROPOSED_IMPROVEMENTS);

  const [activeTab, setActiveTab] = useState<'overview' | 'spending' | 'audit' | 'splits' | 'improvements' | 'sheets'>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedTicket, setSelectedTicket] = useState<ExpenseTicket | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google OAuth state (tokens kept strictly in-memory per skill requirements)
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Confirmation modal for mutating user spreadsheet data
  const [confirmUpdateModal, setConfirmUpdateModal] = useState<{
    isOpen: boolean;
    ticket: ExpenseTicket | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    ticket: null,
    isLoading: false,
  });

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('family_ledger_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('family_ledger_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('family_ledger_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('family_ledger_financial_plan', JSON.stringify(financialPlan));
  }, [financialPlan]);

  useEffect(() => {
    localStorage.setItem('family_ledger_sheet_config', JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        showToast(`Connected as ${result.user.displayName || result.user.email}`);
      }
    } catch (err: any) {
      showToast(`Google Sign-In: ${err.message || 'Cancelled'}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    showToast('Signed out of Google Workspace');
  };

  const handleUpdateTicket = (updated: ExpenseTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTicket?.id === updated.id) {
      setSelectedTicket(updated);
    }
    showToast(`Updated ticket ${updated.id} (${updated.merchant})`);
  };

  const handleDeleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (selectedTicket?.id === id) {
      setSelectedTicket(null);
    }
    showToast(`Removed ticket ${id}`);
  };

  const handleAddTicket = (newTicket: ExpenseTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    showToast(`Ingested new receipt for ${newTicket.merchant} ($${newTicket.amount.toFixed(2)})`);
  };

  const handleSyncSheets = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSheetConfig((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      showToast('Synchronized with Google Sheet "Family_Receipts_AI"');
    }, 1200);
  };

  // Triggered when clicking Approve & Verify on a ticket
  const handleRequestSheetVerification = (ticket: ExpenseTicket) => {
    if (googleAccessToken && ticket.sheetRowIndex) {
      setConfirmUpdateModal({
        isOpen: true,
        ticket,
        isLoading: false,
      });
    } else {
      // Offline / Local verification
      handleUpdateTicket({
        ...ticket,
        status: 'verified',
        aiNotes: (ticket.aiNotes ? ticket.aiNotes + ' · ' : '') + 'Verified by family review on ' + new Date().toLocaleDateString(),
      });
    }
  };

  // Confirmed writing back to Google Sheet
  const handleExecuteSheetVerification = async () => {
    const ticket = confirmUpdateModal.ticket;
    if (!ticket) return;

    setConfirmUpdateModal((prev) => ({ ...prev, isLoading: true }));

    try {
      if (googleAccessToken && ticket.sheetRowIndex) {
        const match = sheetConfig.sheetIdOrUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        const spreadsheetId = match ? match[1] : sheetConfig.sheetIdOrUrl;

        // Status is typically column H
        await updateSheetCell(
          googleAccessToken,
          spreadsheetId,
          sheetConfig.sheetName,
          `H${ticket.sheetRowIndex}`,
          'Verified'
        );
      }

      handleUpdateTicket({
        ...ticket,
        status: 'verified',
        aiNotes: (ticket.aiNotes ? ticket.aiNotes + ' · ' : '') + 'Verified & written to Google Sheet row #' + (ticket.sheetRowIndex || 1),
      });

      showToast(`Sheet row #${ticket.sheetRowIndex} updated to "Verified"!`);
    } catch (err: any) {
      showToast(`Sheet update notice: ${err.message}`);
    } finally {
      setConfirmUpdateModal({ isOpen: false, ticket: null, isLoading: false });
    }
  };

  const handleBatchVerifyAll = () => {
    setTickets((prev) =>
      prev.map((t) =>
        t.status === 'needs_review' || t.status === 'flagged'
          ? {
              ...t,
              status: 'verified',
              aiNotes: (t.aiNotes ? t.aiNotes + ' · ' : '') + 'Batch verified on ' + new Date().toLocaleDateString(),
            }
          : t
      )
    );
    showToast('All pending tickets marked verified!');
  };

  const handleImportLiveTickets = (newTickets: ExpenseTicket[]) => {
    setTickets(newTickets);
    showToast(`Loaded ${newTickets.length} live expense rows from Google Sheets!`);
  };

  const needsReviewCount = tickets.filter(
    (t) => t.date.startsWith(selectedMonth) && (t.status === 'needs_review' || t.status === 'flagged')
  ).length;

  return (
    <div className={`min-h-screen ${isMobileMode ? 'bg-slate-900/95 sm:py-6 sm:px-4' : 'bg-slate-50'} flex flex-col text-slate-900 transition-colors`}>
      {/* Main App Container: Phone Chasis when isMobileMode is true on desktop, or full screen */}
      <div className={`mx-auto w-full transition-all flex flex-col ${
        isMobileMode 
          ? 'max-w-md bg-white sm:rounded-[44px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-[850px] relative' 
          : 'max-w-7xl'
      }`}>
        {/* Simulated Phone Notch & Status Bar (shown when in mobile mode on desktop) */}
        {isMobileMode && (
          <div className="hidden sm:flex items-center justify-between px-6 pt-3 pb-2 text-[11px] font-semibold text-slate-800 bg-white border-b border-slate-100 select-none">
            <span className="font-mono">9:41</span>
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1 text-slate-700">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Top Navigation Bar */}
        <HeaderNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
          needsReviewCount={needsReviewCount}
          googleUser={googleUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          isAuthLoading={isAuthLoading}
          isMobileMode={isMobileMode}
          onToggleMobileMode={() => setIsMobileMode(!isMobileMode)}
        />

        {/* Main Content Area */}
        <main className={`flex-1 w-full mx-auto px-3 sm:px-6 py-4 pb-28 ${isMobileMode ? 'max-w-full' : 'max-w-7xl'}`}>
          {toastMessage && (
            <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in max-w-[90vw]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <DashboardOverview
              tickets={tickets}
              categories={categories}
              members={members}
              financialPlan={financialPlan}
              onOpenBudgetSettings={() => setIsBudgetModalOpen(true)}
              onOpenSourcesModal={() => setIsSourcesModalOpen(true)}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              onSelectTicket={(t) => {
                setSelectedTicket(t);
                setActiveTab('audit');
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSyncSheets={handleSyncSheets}
              isSyncing={isSyncing}
              isMobileMode={isMobileMode}
            />
          )}

          {activeTab === 'spending' && (
            <SpendingView
              tickets={tickets}
              categories={categories}
              members={members}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              onOpenBudgetSettings={() => setIsBudgetModalOpen(true)}
              onSelectTicket={(t) => {
                setSelectedTicket(t);
                setActiveTab('audit');
              }}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'audit' && (
            <TicketAuditView
              tickets={tickets}
              members={members}
              categories={categories}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              onUpdateTicket={handleUpdateTicket}
              onDeleteTicket={handleDeleteTicket}
              onRequestSheetVerification={handleRequestSheetVerification}
              onBatchVerifyAll={handleBatchVerifyAll}
              isConnectedToSheet={!!googleAccessToken}
            />
          )}

          {activeTab === 'splits' && (
            <FamilySplitsView
              tickets={tickets}
              members={members}
              selectedMonth={selectedMonth}
              financialPlan={financialPlan}
              onOpenBudgetSettings={() => setIsBudgetModalOpen(true)}
            />
          )}

          {activeTab === 'improvements' && (
            <ImprovementsView
              improvements={improvements}
              tickets={tickets}
            />
          )}

          {activeTab === 'sheets' && (
            <SheetsPipelineView
              sheetConfig={sheetConfig}
              onUpdateSheetConfig={setSheetConfig}
              tickets={tickets}
              onSyncSheets={handleSyncSheets}
              isSyncing={isSyncing}
              googleUser={googleUser}
              googleAccessToken={googleAccessToken}
              onGoogleSignIn={handleGoogleSignIn}
              onGoogleSignOut={handleGoogleSignOut}
              isAuthLoading={isAuthLoading}
              onImportLiveTickets={handleImportLiveTickets}
              members={members}
              categories={categories}
            />
          )}
        </main>

        {/* Clean quiet footer (only shown when in desktop full mode) */}
        {!isMobileMode && (
          <footer className="mt-auto border-t border-slate-200 bg-white py-6 mb-16 sm:mb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">FamilyLedger</span>
                <span aria-hidden="true">·</span>
                <span>Google Sheets & WhatsApp Ingestion Architecture</span>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('improvements')}
                  className="hover:text-indigo-600 transition-colors"
                >
                  WhatsApp vs Form Guide
                </button>
                <button
                  onClick={() => setActiveTab('sheets')}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Google Drive & Sheets
                </button>
                <button
                  onClick={() => setActiveTab('splits')}
                  className="hover:text-indigo-600 transition-colors"
                >
                  Family Settlements
                </button>
              </div>
            </div>
          </footer>
        )}

        {/* Fixed Mobile Bottom Navigation Bar with clear icons and tabs */}
        <BottomNavBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          needsReviewCount={needsReviewCount}
          isMobileMode={isMobileMode}
        />

        {/* Phone Bottom Home Indicator */}
        {isMobileMode && (
          <div className="hidden sm:block py-1 bg-white select-none">
            <div className="w-32 h-1 bg-slate-400 rounded-full mx-auto" />
          </div>
        )}
      </div>

      {/* Upload / Ingest Ticket Modal */}
      <AddTicketModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTicket={handleAddTicket}
        members={members}
        categories={categories}
      />

      {/* Confirmation Modal for Google Sheet Data Mutations */}
      <ConfirmSheetUpdateModal
        isOpen={confirmUpdateModal.isOpen}
        onClose={() => setConfirmUpdateModal({ isOpen: false, ticket: null, isLoading: false })}
        onConfirm={handleExecuteSheetVerification}
        title="Confirm Google Sheet Verification"
        description="Are you sure you want to write the verified status back to your live Google Sheet row? This will update the status cell in your connected spreadsheet."
        sheetName={sheetConfig.sheetName}
        affectedRow={confirmUpdateModal.ticket?.sheetRowIndex || 1}
        newValue="Verified"
        isLoading={confirmUpdateModal.isLoading}
      />

      {/* Monthly Budget, Earnings & Split Ratios Setting Modal */}
      <BudgetSettingsModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        onUpdateCategories={(newCats) => {
          setCategories(newCats);
          showToast('Updated category spending limits!');
        }}
        financialPlan={financialPlan}
        onUpdateFinancialPlan={(newPlan) => {
          setFinancialPlan(newPlan);
          showToast('Updated household earnings, savings vault & split rules!');
        }}
        members={members}
      />

      {/* Family Members, WhatsApp Numbers & Sources Settings Modal */}
      <FamilySourcesSettingsModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        members={members}
        onUpdateMembers={(newMembers) => {
          setMembers(newMembers);
          showToast('Updated family members, names & phone numbers!');
        }}
        sheetConfig={sheetConfig}
        onUpdateSheetConfig={(newConfig) => {
          setSheetConfig(newConfig);
          showToast('Updated data source configuration!');
        }}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isAuthLoading={isAuthLoading}
        onSyncSheets={handleSyncSheets}
        isSyncing={isSyncing}
      />
    </div>
  );
}
