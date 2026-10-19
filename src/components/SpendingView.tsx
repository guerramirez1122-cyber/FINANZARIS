import React, { useState } from 'react';
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
  PieChart
} from 'lucide-react';

interface SpendingViewProps {
  tickets: ExpenseTicket[];
  categories: ExpenseCategory[];
  members: FamilyMember[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onOpenBudgetSettings: () => void;
  onSelectTicket: (ticket: ExpenseTicket) => void;
  onOpenAddModal: () => void;
  onNavigateTab: (tab: 'overview' | 'spending' | 'audit' | 'splits' | 'improvements' | 'sheets') => void;
}

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

  const categorySpends = calculateCategorySpends(tickets, categories, selectedMonth);
  const overviewMetrics = calculateOverviewMetrics(tickets, categories, selectedMonth);
  const monthTickets = tickets.filter((t) => t.date.startsWith(selectedMonth));

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
          {/* Month selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-2xs">
            <button
              onClick={() => setSelectedMonth('2026-10')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg transition-colors font-medium ${
                selectedMonth === '2026-10'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Oct 2026
            </button>
            <button
              onClick={() => setSelectedMonth('2026-09')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg transition-colors font-medium ${
                selectedMonth === '2026-09'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Sep 2026
            </button>
          </div>

          {/* Action: Open Budget Settings */}
          <button
            onClick={onOpenBudgetSettings}
            className="min-h-[48px] px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 touch-manipulation active:scale-95"
            title="Modificar límites de gasto y metas de ahorro"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Ajustar Límites</span>
          </button>

          {/* Action: Upload Ticket */}
          <button
            onClick={onOpenAddModal}
            className="min-h-[48px] px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 touch-manipulation active:scale-95"
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
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Ver Todas las Categorías
              </button>
            )}

            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Ir a Auditoría Completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search and Category Filter Pills */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por comercio, producto o concepto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-indigo-500 min-h-[44px]"
            />
          </div>

          {/* Quick Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({monthTickets.length})
            </button>
            {categories.map((c) => {
              const count = monthTickets.filter((t) => t.category === c.name).length;
              const isSelected = selectedCategoryFilter === c.name;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryFilter(c.name)}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : c.color }}
                  />
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tickets List: Mobile Cards */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No hay tickets en esta categoría</h3>
            <p className="text-xs text-slate-500">
              Usa el botón de arriba o la cámara trasera para escanear y asignar tickets a esta categoría.
            </p>
            <button
              onClick={onOpenAddModal}
              className="min-h-[44px] px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Ticket a {selectedCategoryFilter === 'all' ? 'Gastos' : selectedCategoryFilter}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const member = members.find((m) => m.id === ticket.paidByMemberId);
              const isVerified = ticket.status === 'verified';

              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    onSelectTicket(ticket);
                    onNavigateTab('audit');
                  }}
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200 rounded-2xl space-y-2.5 transition-all cursor-pointer touch-manipulation active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <span className="font-semibold text-slate-700">{ticket.id}</span>
                        <span>·</span>
                        <span>{ticket.date}</span>
                        <span>·</span>
                        <span className="text-slate-600">{ticket.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{ticket.merchant}</h4>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                        {formatCurrency(ticket.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Tax: {formatCurrency(ticket.taxAmount || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-slate-600 truncate">
                    {ticket.items.map((i) => `${i.description} (${i.quantity}x)`).join(', ')}
                  </div>

                  {/* Footer with Paid By, Status, and Action */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      {member?.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                          {ticket.paidByMemberId.slice(0, 1)}
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-700">
                        {member?.name || ticket.paidByMemberId}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isVerified ? '✓ Verificado' : '⚠ Requiere Revisión'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket);
                        onNavigateTab('audit');
                      }}
                      className="min-h-[40px] px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1 active:scale-95"
                    >
                      <span>Auditar</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
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
