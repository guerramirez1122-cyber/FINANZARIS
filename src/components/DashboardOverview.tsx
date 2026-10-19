import React from 'react';
import { 
  FamilyMember, 
  ExpenseCategory, 
  ExpenseTicket, 
  HouseholdFinancialPlan 
} from '../types/expense';
import { 
  formatCurrency, 
  calculateOverviewMetrics 
} from '../utils/calculations';
import { 
  ArrowRight, 
  RefreshCw, 
  FileSpreadsheet,
  Sliders,
  Users,
  PieChart,
  Receipt
} from 'lucide-react';

interface DashboardOverviewProps {
  tickets: ExpenseTicket[];
  categories: ExpenseCategory[];
  members: FamilyMember[];
  financialPlan: HouseholdFinancialPlan;
  onOpenBudgetSettings: () => void;
  onOpenSourcesModal?: () => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  onSelectTicket: (t: ExpenseTicket) => void;
  onNavigateTab: (tab: 'overview' | 'spending' | 'audit' | 'splits' | 'improvements' | 'sheets') => void;
  onSyncSheets: () => void;
  isSyncing: boolean;
  isMobileMode?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tickets,
  categories,
  onOpenBudgetSettings,
  onOpenSourcesModal,
  selectedMonth,
  setSelectedMonth,
  onNavigateTab,
  onSyncSheets,
  isSyncing,
}) => {
  const metrics = calculateOverviewMetrics(tickets, categories, selectedMonth);

  return (
    <div className="space-y-6">
      {/* Contextual Sub-Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Household Workspace</span>
            <span aria-hidden="true">·</span>
            <span>FamilyLedger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Family Expense Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-2xs min-h-[44px]">
            <button
              onClick={() => setSelectedMonth('2026-10')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg transition-colors font-medium ${
                selectedMonth === '2026-10'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Oct 2026
            </button>
            <button
              onClick={() => setSelectedMonth('2026-09')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg transition-colors font-medium ${
                selectedMonth === '2026-09'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Sep 2026
            </button>
          </div>

          {/* Sync Sheet Trigger */}
          <button
            onClick={onSyncSheets}
            disabled={isSyncing}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 touch-manipulation"
            title="Refrescar datos desde Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* Sources & Members Settings Trigger */}
          {onOpenSourcesModal && (
            <button
              onClick={onOpenSourcesModal}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 touch-manipulation"
              title="Configurar orígenes de datos, nombres y números"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Fuentes</span>
            </button>
          )}

          {/* Budget Modal Trigger */}
          <button
            onClick={onOpenBudgetSettings}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 touch-manipulation"
            title="Configurar metas de presupuesto y división"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Primary Minimal View: 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Family Spend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
              Total Family Spend
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {formatCurrency(metrics.totalSpent)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="font-mono font-semibold text-slate-700">
                {metrics.budgetUtilizationPercent.toFixed(1)}%
              </span>
              <span>de {formatCurrency(metrics.totalBudget)} presupuestado</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.budgetUtilizationPercent > 90 ? 'bg-rose-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, metrics.budgetUtilizationPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Safe Remaining Budget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
              Safe Remaining Budget
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600 mt-2">
              {formatCurrency(metrics.remainingBudget)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span>Día {metrics.currentDay} de {metrics.daysInMonth}</span>
              <span aria-hidden="true">·</span>
              <span>{Math.max(0, metrics.daysInMonth - metrics.currentDay)} días restantes</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-4 font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg w-fit">
            {formatCurrency(metrics.remainingBudget / Math.max(1, metrics.daysInMonth - metrics.currentDay))}/día disponible
          </div>
        </div>

        {/* Card 3: Daily Burn Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
              Daily Burn Rate
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {formatCurrency(metrics.dailyBurnRate)}
              <span className="text-xs font-normal text-slate-400"> /día</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span>Proyección fin de mes:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-700">
                {formatCurrency(metrics.projectedMonthEndTotal)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-emerald-700 mt-4 font-medium flex items-center gap-1">
            <span>Bajo presupuesto por {formatCurrency(Math.max(0, metrics.totalBudget - metrics.projectedMonthEndTotal))}</span>
          </div>
        </div>

        {/* Card 4: AI Ingested tickets */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
              AI Ingested tickets
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">
              {metrics.monthTickets.length}
              <span className="text-xs font-normal text-slate-400"> tickets</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <span className="text-emerald-700 font-semibold">{metrics.verifiedCount} verificados</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 font-semibold">{metrics.needsReviewCount} revisión</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sincronizado</span>
            </div>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
            >
              <span>Ver Auditoría</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Navigation Callout to Spending Tab */}
      <div className="bg-gradient-to-r from-indigo-50/80 to-slate-50 border border-indigo-100/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Límites de Presupuesto por Categoría &amp; Tickets
            </h3>
            <p className="text-xs text-slate-500">
              Consulta el desglose detallado de gastos y tickets asociados en la nueva pestaña Spending.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('spending')}
          className="min-h-[44px] px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 active:scale-95 touch-manipulation"
        >
          <span>Abrir Pestaña Spending</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
