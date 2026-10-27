/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  ReceiptText, 
  Flame,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Settings2,
  FileSpreadsheet,
  Lightbulb,
  X,
  ChevronRight
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets';
  setActiveTab: (tab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets') => void;
  onOpenAddModal?: () => void;
  onOpenBudgetModal?: () => void;
  needsReviewCount: number;
  isMobileMode?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  needsReviewCount,
  isMobileMode = false,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Determinar si la pestaña "Más" está activa (cuando no son las 4 principales)
  const isMoreTabActive = 
    activeTab === 'settings' || 
    activeTab === 'performance' || 
    activeTab === 'splits' || 
    activeTab === 'sheets' || 
    activeTab === 'improvements';

  const handleSelectSubTab = (tab: 'settings' | 'performance' | 'splits' | 'sheets' | 'improvements') => {
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Mobile "Más" Bottom Sheet Modal */}
      {isMoreMenuOpen && (
        <div 
          className={`z-50 ${isMobileMode ? 'fixed sm:absolute inset-0' : 'fixed inset-0'} flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in`}
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            className={`bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 space-y-4 max-w-lg mx-auto w-full mb-14 ${
              isMobileMode ? 'sm:rounded-t-3xl sm:mb-14' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Más Funciones</h3>
                  <p className="text-[11px] text-slate-500">Herramientas financieras del hogar</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Menu Options Grid */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {/* Option 1: Balance & Rendimiento */}
              <button
                type="button"
                onClick={() => handleSelectSubTab('performance')}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'performance'
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Balance y Rendimiento Anual</div>
                    <div className="text-[10px] text-slate-500">Ingresos vs. gastos, tasa de ahorro y evolución 2026</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Option 2: División Familiar (Splits) */}
              <button
                type="button"
                onClick={() => handleSelectSubTab('splits')}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'splits'
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">División Familiar (Splits)</div>
                    <div className="text-[10px] text-slate-500">Cuentas claras y saldos cruzados entre miembros</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Option 3: Ajustes Generales, Presupuesto y Fuentes */}
              <button
                type="button"
                onClick={() => handleSelectSubTab('settings')}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'settings'
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-2xs">
                    <Settings2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Ajustes &amp; Presupuesto</div>
                    <div className="text-[10px] text-slate-500">Fuentes de ingreso, límites por rubro e instalador PWA</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Option 4: Google Sheets & Drive */}
              <button
                type="button"
                onClick={() => handleSelectSubTab('sheets')}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'sheets'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                    <FileSpreadsheet className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Google Sheets &amp; Drive Sync</div>
                    <div className="text-[10px] text-slate-500">Sincronización en la nube con tu hoja de cálculo</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Option 5: Guía de Mejoras */}
              <button
                type="button"
                onClick={() => handleSelectSubTab('improvements')}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  activeTab === 'improvements'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                    <Lightbulb className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Guía de Ingestión WhatsApp</div>
                    <div className="text-[10px] text-slate-500">Pipeline de tickets con IA vs formulario Google</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 5-Tab Native Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Barra de navegación móvil"
        className={`z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] px-1 py-1 safe-area-pb transition-all ${
          isMobileMode
            ? 'fixed sm:absolute bottom-0 left-0 right-0 sm:max-w-md mx-auto sm:rounded-b-[36px]'
            : 'fixed bottom-0 left-0 right-0 max-w-full'
        }`}
      >
        <div className="flex items-center justify-between h-[58px] px-0.5 relative">
          
          {/* Tab 1: INICIO (Overview) */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
              activeTab === 'overview'
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Ir a pestaña Inicio"
            aria-current={activeTab === 'overview' ? 'page' : undefined}
          >
            <div className="relative">
              <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'overview' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
              {activeTab === 'overview' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] tracking-tight mt-1 ${activeTab === 'overview' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
              Inicio
            </span>
          </button>

          {/* Tab 2: GASTOS (Spending) */}
          <button
            onClick={() => setActiveTab('spending')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
              activeTab === 'spending'
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Ir a pestaña Gastos"
            aria-current={activeTab === 'spending' ? 'page' : undefined}
          >
            <div className="relative">
              <PieChart className={`w-5 h-5 transition-transform ${activeTab === 'spending' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
              {activeTab === 'spending' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] tracking-tight mt-1 ${activeTab === 'spending' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
              Gastos
            </span>
          </button>

          {/* Tab 3: DEUDAS (Avalancha Multidivisa) */}
          <button
            onClick={() => setActiveTab('debts')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
              activeTab === 'debts'
                ? 'text-rose-600 font-bold bg-rose-50/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Ir a Avalancha de Deudas"
            aria-current={activeTab === 'debts' ? 'page' : undefined}
          >
            <div className="relative">
              <Flame className={`w-5 h-5 transition-transform ${activeTab === 'debts' ? 'stroke-[2.5px] scale-110 fill-rose-500 text-rose-500' : 'stroke-[1.8px]'}`} />
              {activeTab === 'debts' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-rose-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] tracking-tight mt-1 ${activeTab === 'debts' ? 'font-bold text-rose-700' : 'font-medium'}`}>
              Deudas
            </span>
          </button>

          {/* Tab 4: TICKETS (Auditoría con Badge) */}
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
              activeTab === 'audit'
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Ir a Auditoría de Tickets"
            aria-current={activeTab === 'audit' ? 'page' : undefined}
          >
            <div className="relative">
              <ReceiptText className={`w-5 h-5 transition-transform ${activeTab === 'audit' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
              {needsReviewCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white font-bold text-[10px] rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center shadow-xs">
                  {needsReviewCount}
                </span>
              )}
              {activeTab === 'audit' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] tracking-tight mt-1 ${activeTab === 'audit' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
              Tickets
            </span>
          </button>

          {/* Tab 5: MÁS (Balance, División, Sheets, Ajustes) */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
              isMoreTabActive
                ? 'text-indigo-600 font-bold bg-indigo-50/70'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Ver más opciones de la app"
            aria-current={isMoreTabActive ? 'page' : undefined}
          >
            <div className="relative">
              <SlidersHorizontal className={`w-5 h-5 transition-transform ${isMoreTabActive ? 'stroke-[2.5px] scale-110 text-indigo-600' : 'stroke-[1.8px]'}`} />
              {isMoreTabActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] tracking-tight mt-1 ${isMoreTabActive ? 'font-bold text-indigo-700' : 'font-medium'}`}>
              {activeTab === 'performance' 
                ? 'Balance' 
                : activeTab === 'splits' 
                ? 'División' 
                : activeTab === 'sheets' 
                ? 'Sheets' 
                : activeTab === 'improvements' 
                ? 'Mejoras' 
                : 'Más'}
            </span>
          </button>

        </div>
      </nav>
    </>
  );
};
