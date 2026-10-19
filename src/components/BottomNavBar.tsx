import React from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  ReceiptText, 
  Users,
  Settings2
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'overview' | 'spending' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets';
  setActiveTab: (tab: 'overview' | 'spending' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets') => void;
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
  return (
    <nav 
      aria-label="Barra de navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] px-2 py-1 safe-area-pb w-full"
    >
      <div className="max-w-md mx-auto flex items-center justify-between h-[64px] px-1 relative">
        
        {/* Tab 1: OVERVIEW */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'overview'
              ? 'text-indigo-600 font-bold bg-indigo-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a pestaña Overview"
          aria-current={activeTab === 'overview' ? 'page' : undefined}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'overview' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
            {activeTab === 'overview' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'overview' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
            Overview
          </span>
        </button>

        {/* Tab 2: SPENDING */}
        <button
          onClick={() => setActiveTab('spending')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'spending'
              ? 'text-indigo-600 font-bold bg-indigo-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a pestaña Spending (Límites y Gastos)"
          aria-current={activeTab === 'spending' ? 'page' : undefined}
        >
          <div className="relative">
            <PieChart className={`w-5 h-5 transition-transform ${activeTab === 'spending' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
            {activeTab === 'spending' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'spending' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
            Spending
          </span>
        </button>

        {/* Tab 3: TICKETS */}
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
          <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'audit' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
            Tickets
          </span>
        </button>

        {/* Tab 4: SPLITS */}
        <button
          onClick={() => setActiveTab('splits')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'splits'
              ? 'text-indigo-600 font-bold bg-indigo-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a División Familiar"
          aria-current={activeTab === 'splits' ? 'page' : undefined}
        >
          <div className="relative">
            <Users className={`w-5 h-5 transition-transform ${activeTab === 'splits' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
            {activeTab === 'splits' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'splits' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
            División
          </span>
        </button>

        {/* Tab 5: AJUSTES (Fuentes, Presupuesto y Preferencias) */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'settings'
              ? 'text-indigo-600 font-bold bg-indigo-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a Ajustes de Presupuesto y Fuentes"
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <div className="relative">
            <Settings2 className={`w-5 h-5 transition-transform ${activeTab === 'settings' ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
            {activeTab === 'settings' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 ${activeTab === 'settings' ? 'font-bold text-indigo-700' : 'font-medium'}`}>
            Ajustes
          </span>
        </button>

      </div>
    </nav>
  );
};
