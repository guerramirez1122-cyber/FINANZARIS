import React, { useState, useMemo } from 'react';
import { 
  ExpenseTicket, 
  ExpenseCategory, 
  FamilyMember, 
  HouseholdFinancialPlan 
} from '../types/expense';
import { formatCurrency } from '../utils/calculations';
import { 
  calculateMonthlyPerformance, 
  calculateYearlyAggregated,
  getPreviousMonthKey
} from '../utils/performanceCalculations';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign, 
  PiggyBank, 
  Calendar, 
  ChevronDown, 
  Check, 
  ArrowRight, 
  Sliders, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Sparkles,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface MonthlyPerformanceViewProps {
  tickets: ExpenseTicket[];
  categories: ExpenseCategory[];
  members: FamilyMember[];
  financialPlan: HouseholdFinancialPlan;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  onOpenBudgetSettings: () => void;
  onNavigateTab: (tab: 'overview' | 'spending' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets' | 'performance') => void;
}

const MONTH_OPTIONS = [
  { id: '2026-10', label: 'Octubre 2026' },
  { id: '2026-09', label: 'Septiembre 2026' },
  { id: '2026-08', label: 'Agosto 2026' },
];

export const MonthlyPerformanceView: React.FC<MonthlyPerformanceViewProps> = ({
  tickets,
  categories,
  members,
  financialPlan,
  selectedMonth,
  setSelectedMonth,
  onOpenBudgetSettings,
  onNavigateTab,
}) => {
  const [viewScope, setViewScope] = useState<'monthly' | 'yearly'>('monthly');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Compute monthly performance and category efficiencies
  const { metrics, categoryEfficiencies } = useMemo(() => {
    return calculateMonthlyPerformance(tickets, categories, financialPlan, selectedMonth);
  }, [tickets, categories, financialPlan, selectedMonth]);

  // Compute aggregated yearly data for 2026
  const yearlyMetrics = useMemo(() => {
    return calculateYearlyAggregated(tickets, categories, financialPlan, 2026);
  }, [tickets, categories, financialPlan]);

  const currentMonthOption = MONTH_OPTIONS.find((m) => m.id === selectedMonth) || {
    id: selectedMonth,
    label: selectedMonth,
  };

  const previousMonthLabel = MONTH_OPTIONS.find((m) => m.id === metrics.previousMonth)?.label || metrics.previousMonth;

  // Data for Income vs Spending Comparative Chart (Month-over-Month)
  const incomeVsSpendingData = [
    {
      period: `Mes Anterior (${previousMonthLabel.split(' ')[0]})`,
      Ingresos: metrics.totalIncome,
      Gasto: metrics.totalSpentPrevious,
      Ahorro: metrics.netSavingsPrevious,
      TasaAhorro: Number(metrics.savingsRatePrevious.toFixed(1)),
    },
    {
      period: `Mes Actual (${currentMonthOption.label.split(' ')[0]})`,
      Ingresos: metrics.totalIncome,
      Gasto: metrics.totalSpentCurrent,
      Ahorro: metrics.netSavingsCurrent,
      TasaAhorro: Number(metrics.savingsRateCurrent.toFixed(1)),
    },
  ];

  // Data for Category Efficiency Comparison
  const categoryChartData = categoryEfficiencies.map((c) => ({
    name: c.categoryName,
    shortName: c.categoryName.split(' ')[0],
    MesAnterior: c.previousSpend,
    MesActual: c.currentSpend,
    color: c.color,
  }));

  // Tooltip for Category Comparison Chart
  const CustomCategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const prev = payload.find((p: any) => p.dataKey === 'MesAnterior')?.value || 0;
      const curr = payload.find((p: any) => p.dataKey === 'MesActual')?.value || 0;
      const delta = curr - prev;
      const pct = prev > 0 ? (delta / prev) * 100 : 0;

      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
          <div className="font-bold text-slate-200 pb-1.5 border-b border-slate-800">
            {label}
          </div>
          <div className="py-2 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span>{previousMonthLabel}:</span>
              <span className="font-mono font-semibold text-slate-200">{formatCurrency(prev)}</span>
            </div>
            <div className="flex items-center justify-between text-indigo-300">
              <span>{currentMonthOption.label}:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(curr)}</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Variación:</span>
            <span className={`font-mono font-bold ${delta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {delta <= 0 ? '▼ ' : '▲ '}
              {formatCurrency(Math.abs(delta))} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Monthly Performance Summary
            </h1>
            <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              Finanzas &amp; Ahorro
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ingresos vs. gastos, tasa de ahorro y eficiencia por categoría respecto al mes anterior.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Toggle: Monthly vs Yearly */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewScope('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all touch-manipulation ${
                viewScope === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resumen Mensual
            </button>
            <button
              onClick={() => setViewScope('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all touch-manipulation ${
                viewScope === 'yearly'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Anual 2026
            </button>
          </div>

          {/* Month Selector Dropdown (Shown in Monthly mode) */}
          {viewScope === 'monthly' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="min-h-[40px] flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 touch-manipulation"
                title="Seleccionar mes para evaluar rendimiento"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentMonthOption.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMonthDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMonthDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 animate-fade-in">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Mes a evaluar
                    </div>
                    {MONTH_OPTIONS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMonth(m.id);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                          selectedMonth === m.id
                            ? 'bg-indigo-50 font-bold text-indigo-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{m.label}</span>
                        {selectedMonth === m.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: MONTHLY PERFORMANCE VIEW                                  */}
      {/* ===================================================================== */}
      {viewScope === 'monthly' && (
        <div className="space-y-6">
          {/* Top 3 Metric Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Income vs Spending */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span>Ingresos Totales</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-2">
                  {formatCurrency(metrics.totalIncome)}
                </div>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 font-mono">
                    Gasto: {formatCurrency(metrics.totalSpentCurrent)}
                  </span>
                  <span>({((metrics.totalSpentCurrent / Math.max(1, metrics.totalIncome)) * 100).toFixed(1)}%)</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (metrics.totalSpentCurrent / Math.max(1, metrics.totalIncome)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Savings Rate (Tasa de Ahorro) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span>Tasa de Ahorro (Savings Rate)</span>
                  <PiggyBank className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-600 mt-2">
                  {metrics.savingsRateCurrent.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <span>Meta: </span>
                  <strong className="text-slate-700 font-mono font-semibold">{metrics.targetSavingsRate.toFixed(1)}%</strong>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-600 font-semibold font-mono">
                    {formatCurrency(metrics.netSavingsCurrent)} ahorrados
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px]">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold ${
                  metrics.savingsRateDelta >= 0 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {metrics.savingsRateDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {metrics.savingsRateDelta >= 0 ? '+' : ''}{metrics.savingsRateDelta.toFixed(1)}% vs. {previousMonthLabel.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Card 3: MoM Spend Delta (Variación Mensual de Gasto) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span>Variación vs. Mes Anterior</span>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div className={`text-2xl sm:text-3xl font-bold font-mono mt-2 ${
                  metrics.spendDeltaDollars <= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {metrics.spendDeltaDollars <= 0 ? '▼ ' : '▲ '}
                  {formatCurrency(Math.abs(metrics.spendDeltaDollars))}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">
                  Gasto anterior: <span className="font-mono font-semibold">{formatCurrency(metrics.totalSpentPrevious)}</span>
                </div>
              </div>

              <div className="mt-4 text-[11px] font-medium text-slate-600">
                {metrics.spendDeltaDollars <= 0 ? (
                  <span className="text-emerald-700 font-semibold">
                    ✓ Ahorraste {formatCurrency(Math.abs(metrics.spendDeltaDollars))} más que en {previousMonthLabel.split(' ')[0]}
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold">
                    ⚠ Gasto incrementó {formatCurrency(metrics.spendDeltaDollars)} ({metrics.spendDeltaPercent.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visualization 1: Income vs Spending vs Net Savings Composed Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
                  Comparativa de Ingreso vs. Gasto ({previousMonthLabel.split(' ')[0]} vs. {currentMonthOption.label.split(' ')[0]})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Balance del flujo monetario del hogar y evolución de la tasa de ahorro
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Meta mensual ahorro: <strong className="text-indigo-600 font-mono">{formatCurrency(metrics.targetSavingsMonthly)}</strong>
              </div>
            </div>

            <div className="w-full h-[260px] sm:h-[300px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={incomeVsSpendingData}
                  margin={{ top: 12, right: 20, left: -5, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis 
                    yAxisId="left"
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickFormatter={(v) => `$${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#818cf8" 
                    fontSize={11} 
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'Tasa de Ahorro' ? `${value}%` : formatCurrency(Number(value)),
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: '1px solid #334155',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} name="Ingresos Totales" />
                  <Bar yAxisId="left" dataKey="Gasto" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={45} name="Gasto Realizado" />
                  <Bar yAxisId="left" dataKey="Ahorro" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} name="Ahorro Neto" />
                  <Line yAxisId="right" type="monotone" dataKey="TasaAhorro" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} name="Tasa de Ahorro (%)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Visualization 2: Category-Level Efficiency Compared to Previous Month */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-amber-500" />
                  Eficiencia por Categoría ({currentMonthOption.label.split(' ')[0]} vs. {previousMonthLabel.split(' ')[0]})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoreo de categorías donde se redujo o aumentó el gasto respecto al mes previo
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <TrendingDown className="w-3.5 h-3.5" /> Más eficiente
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                  <TrendingUp className="w-3.5 h-3.5" /> Mayor gasto
                </span>
              </div>
            </div>

            {/* Side-by-Side Category Spending Recharts Bar Chart */}
            <div className="w-full h-[280px] sm:h-[320px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 12, right: 16, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickFormatter={(v) => `$${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomCategoryTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }} 
                  />
                  <Bar 
                    dataKey="MesAnterior" 
                    name={`Mes Anterior (${previousMonthLabel.split(' ')[0]})`} 
                    fill="#94a3b8" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                  />
                  <Bar 
                    dataKey="MesActual" 
                    name={`Mes Actual (${currentMonthOption.label.split(' ')[0]})`} 
                    fill="#4f46e5" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Efficiency Detailed Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {categoryEfficiencies.map((cat) => {
                const isImproved = cat.efficiencyStatus === 'more_efficient';
                const isIncreased = cat.efficiencyStatus === 'less_efficient';

                return (
                  <div 
                    key={cat.categoryId}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" 
                        style={{ backgroundColor: cat.color }} 
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {cat.categoryName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Ant: <span className="font-mono">{formatCurrency(cat.previousSpend)}</span> → Act: <strong className="font-mono text-slate-800">{formatCurrency(cat.currentSpend)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
                        isImproved 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isIncreased 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isImproved ? <TrendingDown className="w-3 h-3" /> : isIncreased ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        <span>{cat.deltaPercent >= 0 ? '+' : ''}{cat.deltaPercent.toFixed(1)}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {cat.deltaDollars <= 0 ? `-${formatCurrency(Math.abs(cat.deltaDollars))}` : `+${formatCurrency(cat.deltaDollars)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: AGGREGATED YEARLY VIEW (2026)                              */}
      {/* ===================================================================== */}
      {viewScope === 'yearly' && (
        <div className="space-y-6 animate-fade-in">
          {/* Yearly Aggregated KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Ingresos Anuales YTD</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(yearlyMetrics.ytdIncome)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                10 meses ({yearlyMetrics.year})
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Gasto Total Acumulado</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 mt-1">
                {formatCurrency(yearlyMetrics.ytdSpending)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Promedio: {formatCurrency(yearlyMetrics.ytdSpending / yearlyMetrics.monthsCount)}/mes
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Ahorro Neto Acumulado</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1">
                {formatCurrency(yearlyMetrics.ytdSavings)}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-1">
                Fondo familiar creciente
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Tasa de Ahorro Anual</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-700 mt-1">
                {yearlyMetrics.averageSavingsRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                ✓ Supera la meta anual
              </div>
            </div>
          </div>

          {/* Yearly Trend Chart: Month by Month (Ene - Dic 2026) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
                  Evolución Anual Mes a Mes (2026)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparativa de ingresos, gastos ejecutados y tasa de ahorro mensual a lo largo del año
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Pico de gasto: <strong className="text-slate-800">{yearlyMetrics.peakSpendingMonth.monthName}</strong> ({formatCurrency(yearlyMetrics.peakSpendingMonth.amount)})
                </span>
              </div>
            </div>

            <div className="w-full h-[280px] sm:h-[340px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={yearlyMetrics.monthlyBreakdown}
                  margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis 
                    yAxisId="left"
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickFormatter={(v) => `$${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#818cf8" 
                    fontSize={11} 
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'Tasa de Ahorro (%)' ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value)),
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: '1px solid #334155',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} name="Ingresos Mensuales" />
                  <Bar yAxisId="left" dataKey="spending" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} name="Gasto Realizado" />
                  <Line yAxisId="right" type="monotone" dataKey="savingsRate" stroke="#6366f1" strokeWidth={2.8} dot={{ r: 4, fill: '#6366f1' }} name="Tasa de Ahorro (%)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yearly Category Share & Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Share Donut / Pie Chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  Distribución de Gasto Anual
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Participación porcentual de cada categoría en 2026
                </p>
              </div>

              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={yearlyMetrics.categoryYearlyTotals}
                      dataKey="totalAmount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {yearlyMetrics.categoryYearlyTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {yearlyMetrics.categoryYearlyTotals.slice(0, 4).map((c) => (
                  <div key={c.categoryName} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-700 truncate">{c.categoryName}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{c.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Month by Month Aggregated Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tabla Desglosada Año 2026
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historial de meses transcurridos y proyecciones de cierre
                  </p>
                </div>
                <span className="text-xs text-indigo-600 font-semibold">
                  Meta ahorro: 41.2%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Mes</th>
                      <th className="py-2.5 px-3">Ingresos</th>
                      <th className="py-2.5 px-3">Gastos</th>
                      <th className="py-2.5 px-3">Ahorro Neto</th>
                      <th className="py-2.5 px-3">Tasa Ahorro</th>
                      <th className="py-2.5 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {yearlyMetrics.monthlyBreakdown.map((m) => (
                      <tr key={m.monthKey} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3 font-bold font-sans text-slate-900 flex items-center gap-1.5">
                          {m.monthName}
                          {m.isProjected && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 font-sans font-semibold">Proy</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{formatCurrency(m.income)}</td>
                        <td className="py-2 px-3 text-slate-900 font-semibold">{formatCurrency(m.spending)}</td>
                        <td className="py-2 px-3 text-emerald-600 font-bold">{formatCurrency(m.savings)}</td>
                        <td className="py-2 px-3 text-indigo-600 font-bold">{m.savingsRate.toFixed(1)}%</td>
                        <td className="py-2 px-3 font-sans">
                          {m.savingsRate >= 40 ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Excelente
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              Ajustado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
