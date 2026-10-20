import React, { useState } from 'react';
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
  Calendar,
  ChevronDown,
  Check,
  TrendingUp
} from 'lucide-react';

interface DashboardOverviewProps {
  tickets: ExpenseTicket[];
  categories: ExpenseCategory[];
  members: FamilyMember[];
  financialPlan: HouseholdFinancialPlan;
  onOpenBudgetSettings?: () => void;
  onOpenSourcesModal?: () => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  onSelectTicket: (t: ExpenseTicket) => void;
  onNavigateTab: (tab: 'overview' | 'spending' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets') => void;
  onSyncSheets: () => void;
  isSyncing: boolean;
  isMobileMode?: boolean;
}

const MONTH_OPTIONS = [
  { id: '2026-10', label: 'Octubre 2026', shortLabel: 'Oct 2026' },
  { id: '2026-09', label: 'Septiembre 2026', shortLabel: 'Sep 2026' },
  { id: '2026-08', label: 'Agosto 2026', shortLabel: 'Ago 2026' },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tickets,
  categories,
  selectedMonth,
  setSelectedMonth,
  onNavigateTab,
  onSyncSheets,
  isSyncing,
}) => {
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const metrics = calculateOverviewMetrics(tickets, categories, selectedMonth);

  const currentMonthOption = MONTH_OPTIONS.find((m) => m.id === selectedMonth) || {
    id: selectedMonth,
    label: selectedMonth,
    shortLabel: selectedMonth,
  };

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

        <div className="flex items-center gap-2">
          {/* Single Selectable Month Button (Strict Single-Month View, No Summing) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 touch-manipulation"
              title="Seleccionar mes para ver gastos individuales de ese mes"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>{currentMonthOption.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMonthDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMonthDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ver mes individual
                  </div>
                  {MONTH_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMonth(m.id);
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-colors text-left ${
                        selectedMonth === m.id
                          ? 'bg-indigo-50 font-bold text-indigo-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{m.label}</span>
                      {selectedMonth === m.id && <Check className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Balance & Performance Summary Button */}
          <button
            onClick={() => onNavigateTab('performance')}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-xl hover:bg-indigo-100 transition-colors shadow-2xs active:scale-95 touch-manipulation"
            title="Ver Resumen de Rendimiento Mensual y Anual (Ingresos vs Gastos, Tasa de Ahorro)"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Rendimiento</span>
          </button>

          {/* Sync Sheet Trigger */}
          <button
            onClick={onSyncSheets}
            disabled={isSyncing}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 touch-manipulation disabled:opacity-50"
            title="Refrescar datos desde Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* Primary Minimal View: ONLY 4 Key Metric Cards */}
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
    </div>
  );
};
