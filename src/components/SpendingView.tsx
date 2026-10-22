import React, { useState, useMemo } from 'react';
import { 
  ExpenseTicket, 
  ExpenseCategory, 
  FamilyMember 
} from '../types/expense';
import { 
  formatCurrency, 
  calculateCategorySpends, 
  calculateOverviewMetrics 
} from '../utils/calculations';
import { 
  Sliders, 
  Plus, 
  Receipt, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Search,
  ArrowUpRight,
  Sparkles,
  PieChart,
  TrendingUp,
  Calendar,
  ChevronDown,
  Check,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface SpendingViewProps {
  tickets: ExpenseTicket[];
  categories: ExpenseCategory[];
  members: FamilyMember[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onOpenBudgetSettings: () => void;
  onSelectTicket: (ticket: ExpenseTicket) => void;
  onOpenAddModal: () => void;
  onNavigateTab: (tab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets') => void;
}

const MONTH_OPTIONS = [
  { id: '2026-10', label: 'Octubre 2026' },
  { id: '2026-09', label: 'Septiembre 2026' },
  { id: '2026-08', label: 'Agosto 2026' },
];

export const SpendingView: React.FC<SpendingViewProps> = ({
  tickets,
  categories,
  members,
  selectedMonth,
  setSelectedMonth,
  onOpenBudgetSettings,
  onSelectTicket,
  onOpenAddModal,
  onNavigateTab,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [activeChartCategory, setActiveChartCategory] = useState<string>('all');

  const categorySpends = calculateCategorySpends(tickets, categories, selectedMonth);
  const overviewMetrics = calculateOverviewMetrics(tickets, categories, selectedMonth);
  const monthTickets = tickets.filter((t) => t.date.startsWith(selectedMonth));

  const currentMonthOption = MONTH_OPTIONS.find((m) => m.id === selectedMonth) || {
    id: selectedMonth,
    label: selectedMonth,
  };

  // Compute weekly spending patterns across categories for the current month
  const weeklyChartData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const weeks = [
      { key: 'Sem 1', name: 'Semana 1', range: 'Días 1-7', start: 1, end: 7 },
      { key: 'Sem 2', name: 'Semana 2', range: 'Días 8-14', start: 8, end: 14 },
      { key: 'Sem 3', name: 'Semana 3', range: 'Días 15-21', start: 15, end: 21 },
      { key: 'Sem 4', name: 'Semana 4', range: 'Días 22-28', start: 22, end: 28 },
      ...(daysInMonth > 28
        ? [{ key: 'Sem 5', name: 'Semana 5', range: `Días 29-${daysInMonth}`, start: 29, end: daysInMonth }]
        : []),
    ];

    return weeks.map((w) => {
      const entry: Record<string, any> = {
        week: w.key,
        name: w.name,
        range: w.range,
        Total: 0,
      };

      // Initialize all categories to 0
      categories.forEach((cat) => {
        entry[cat.name] = 0;
      });

      monthTickets.forEach((ticket) => {
        const day = parseInt(ticket.date.split('-')[2], 10);
        if (day >= w.start && day <= w.end) {
          entry[ticket.category] = (entry[ticket.category] || 0) + ticket.amount;
          entry.Total += ticket.amount;
        }
      });

      return entry;
    });
  }, [selectedMonth, monthTickets, categories]);

  // Compute weekly summary metrics
  const weeklyMetrics = useMemo(() => {
    if (weeklyChartData.length === 0) {
      return { peakWeek: null, averageWeekly: 0 };
    }
    let peak = weeklyChartData[0];
    let sum = 0;
    weeklyChartData.forEach((w) => {
      sum += w.Total;
      if (w.Total > peak.Total) {
        peak = w;
      }
    });
    return {
      peakWeek: peak,
      averageWeekly: sum / weeklyChartData.length,
    };
  }, [weeklyChartData]);

  // Filtered tickets linked to the chosen category
  const filteredTickets = monthTickets.filter((ticket) => {
    if (selectedCategoryFilter !== 'all' && ticket.category !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMerchant = ticket.merchant.toLowerCase().includes(q);
      const matchCategory = ticket.category.toLowerCase().includes(q);
      const matchItems = ticket.items.some((i) => i.description.toLowerCase().includes(q));
      if (!matchMerchant && !matchCategory && !matchItems) return false;
    }
    return true;
  });

  const overBudgetCategories = categorySpends.filter((c) => c.pacing === 'over_budget');

  // Custom Tooltip for Recharts Line Chart
  const CustomWeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[210px] backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200">{dataPoint.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">{dataPoint.range}</span>
          </div>
          <div className="py-2 space-y-1.5">
            {payload
              .filter((p: any) => p.dataKey !== 'Total' && Number(p.value) > 0)
              .map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: p.stroke || p.color }} 
                    />
                    <span className="text-slate-300 truncate">{p.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-white">
                    {formatCurrency(Number(p.value))}
                  </span>
                </div>
              ))}
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
            <span className="text-indigo-400">Total Semana</span>
            <span className="font-mono text-emerald-400">
              {formatCurrency(Number(dataPoint.Total))}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Spending &amp; Category Limits
            </h1>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              {categories.length} Categorías
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Límites mensuales de gasto vinculados a la entrada de tickets y auditoría de recibos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Single Selectable Month Dropdown */}
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

          {/* Action: View Monthly Performance */}
          <button
            onClick={() => onNavigateTab('performance')}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 rounded-xl transition-all shadow-xs flex items-center gap-1.5 touch-manipulation active:scale-95"
            title="Ver Resumen de Rendimiento y Comparativa vs Mes Anterior"
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Rendimiento</span>
          </button>

          {/* Action: Open Budget Settings */}
          <button
            onClick={onOpenBudgetSettings}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 touch-manipulation active:scale-95"
            title="Modificar límites de gasto y metas de ahorro"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Ajustar Límites</span>
          </button>

          {/* Action: Upload Ticket */}
          <button
            onClick={onOpenAddModal}
            className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 touch-manipulation active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Subir Ticket</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Presupuesto Asignado</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(overviewMetrics.totalBudget)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Límite mensual total</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Gasto Realizado</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-indigo-600 mt-1">
            {formatCurrency(overviewMetrics.totalSpent)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {overviewMetrics.budgetUtilizationPercent.toFixed(1)}% ejecutado
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Margen Disponible</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatCurrency(overviewMetrics.remainingBudget)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1">En presupuesto seguro</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Alertas de Exceso</div>
          <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
            overBudgetCategories.length > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'Categoría' : 'Categorías'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {overBudgetCategories.length > 0 ? 'Excedieron el límite mensual' : 'Todas dentro del límite'}
          </div>
        </div>
      </div>

      {/* RECHARTS LINE CHART: Weekly Spending Patterns Across Categories */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Patrones Semanales de Gasto por Categoría
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evolución semana a semana del consumo en {currentMonthOption.label}
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {weeklyMetrics.peakWeek && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                <div className="text-[11px]">
                  <span className="text-amber-800 font-medium">Pico: </span>
                  <strong className="text-amber-900 font-semibold">{weeklyMetrics.peakWeek.name}</strong>
                  <span className="text-amber-700 font-mono ml-1">({formatCurrency(weeklyMetrics.peakWeek.Total)})</span>
                </div>
              </div>
            )}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px]">
              <span className="text-slate-500">Promedio/Semana: </span>
              <strong className="text-slate-800 font-mono font-bold">
                {formatCurrency(weeklyMetrics.averageWeekly)}
              </strong>
            </div>
          </div>
        </div>

        {/* Category Focus Chips for Chart */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveChartCategory('all')}
            className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all touch-manipulation ${
              activeChartCategory === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas las Categorías
          </button>
          {categories.map((cat) => {
            const isActive = activeChartCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveChartCategory(isActive ? 'all' : cat.name)}
                className={`min-h-[32px] flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all touch-manipulation ${
                  isActive
                    ? 'text-white shadow-2xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                }`}
                style={isActive ? { backgroundColor: cat.color } : {}}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: isActive ? '#ffffff' : cat.color }} 
                />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Recharts Chart Canvas */}
        <div className="w-full h-[280px] sm:h-[320px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyChartData}
              margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="week" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickFormatter={(value) => `$${value}`} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip content={<CustomWeeklyTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '11px', 
                  paddingTop: '12px',
                  color: '#64748b'
                }} 
              />

              {/* Render Line for Total if active or all */}
              {(activeChartCategory === 'all' || activeChartCategory === 'Total') && (
                <Line
                  type="monotone"
                  dataKey="Total"
                  name="Gasto Total Semanal"
                  stroke="#0f172a"
                  strokeWidth={2.8}
                  strokeDasharray="4 4"
                  dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                  activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {/* Render Lines for Categories */}
              {categories.map((cat) => {
                const isFocused = activeChartCategory === cat.name;
                const isHidden = activeChartCategory !== 'all' && !isFocused;

                if (isHidden) return null;

                return (
                  <Line
                    key={cat.id}
                    type="monotone"
                    dataKey={cat.name}
                    name={cat.name}
                    stroke={cat.color}
                    strokeWidth={isFocused ? 3.5 : 2.2}
                    dot={{ r: isFocused ? 5 : 3.5, strokeWidth: 2, fill: cat.color }}
                    activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                    animationDuration={600}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Spending Limits Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Límites y Progreso por Categoría</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toca cualquier categoría para filtrar y auditar los tickets asociados
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Día {overviewMetrics.currentDay} de {overviewMetrics.daysInMonth} del mes
          </span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {categorySpends.map(({ category, spent, percent, remaining, ticketCount, pacing }) => {
            const isSelected = selectedCategoryFilter === category.name;
            const isOverBudget = pacing === 'over_budget';
            const isAccelerated = pacing === 'accelerated';

            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : category.name)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer touch-manipulation active:scale-[0.99] ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{category.name}</h3>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                      {formatCurrency(spent)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      de {formatCurrency(category.monthlyBudget)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget
                        ? 'bg-rose-500'
                        : isAccelerated
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 font-mono">
                      {percent.toFixed(1)}%
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">
                      {isOverBudget ? (
                        <span className="text-rose-600 font-semibold">
                          Exceso: +{formatCurrency(spent - category.monthlyBudget)}
                        </span>
                      ) : (
                        <span>{formatCurrency(remaining)} disponible</span>
                      )}
                    </span>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    isOverBudget
                      ? 'bg-rose-100 text-rose-700'
                      : isAccelerated
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Linked Tickets & Audit Feed Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Tickets Vinculados al Gasto
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedCategoryFilter === 'all'
                ? 'Mostrando todos los tickets del mes actual'
                : `Filtrando por categoría: "${selectedCategoryFilter}"`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedCategoryFilter !== 'all' && (
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className="text-xs text-indigo-600 font-semibold hover:underline px-2 py-1"
              >
                Limpiar filtro
              </button>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ticket o ítem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            No hay tickets registrados para esta categoría en {currentMonthOption.label}.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTickets.map((ticket) => {
              const member = members.find((m) => m.id === ticket.paidByMemberId);
              const cat = categories.find((c) => c.name === ticket.category);

              return (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3 cursor-pointer transition-colors touch-manipulation group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#4f46e5' }}
                    >
                      {ticket.merchant.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ticket.merchant}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          ticket.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {ticket.status === 'verified' ? 'Verificado' : 'Revisión'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{ticket.date}</span>
                        <span>·</span>
                        <span>{ticket.category}</span>
                        {member && (
                          <>
                            <span>·</span>
                            <span className="text-slate-600 font-medium">Por {member.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        {formatCurrency(ticket.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ticket.items.length} {ticket.items.length === 1 ? 'artículo' : 'artículos'}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
