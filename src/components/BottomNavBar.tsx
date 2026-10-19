import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  PieChart, 
  Users, 
  Plus
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: 'overview' | 'spending' | 'audit' | 'splits' | 'improvements' | 'sheets';
  setActiveTab: (tab: 'overview' | 'spending' | 'audit' | 'splits' | 'improvements' | 'sheets') => void;
  onOpenAddModal: () => void;
  onOpenBudgetModal: () => void;
  needsReviewCount: number;
  isMobileMode?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  needsReviewCount,
  isMobileMode = false,
}) => {
  return (
    <nav 
      aria-label="Barra de navegación móvil"
      className={`${
        isMobileMode 
          ? 'sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] px-2 py-1 safe-area-pb w-full' 
          : 'fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] px-2 py-1 safe-area-pb md:hidden'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between h-[64px]">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'overview'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a Dashboard"
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
            {activeTab === 'overview' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-1">Dashboard</span>
        </button>

        {/* Tab 2: Spending (Límites por Categoría y Gastos) */}
        <button
          onClick={() => setActiveTab('spending')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'spending'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a Spending y límites de categoría"
        >
          <div className="relative">
            <PieChart className={`w-5 h-5 ${activeTab === 'spending' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
            {activeTab === 'spending' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-1">Spending</span>
        </button>

        {/* Center Floating Action Button: Escanear / Añadir Ticket con Cámara Trasera */}
        <div className="flex items-center justify-center px-0.5">
          <button
            onClick={onOpenAddModal}
            className="w-13 h-13 rounded-full bg-indigo-600 active:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 transition-transform active:scale-90 min-h-[48px] min-w-[48px] touch-manipulation -mt-4 border-2 border-white ring-2 ring-indigo-600/20"
            title="Escanear ticket con cámara trasera"
            aria-label="Escanear o agregar ticket con la cámara"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
        </div>

        {/* Tab 3: Tickets / Escáner y Auditoría */}
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'audit'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a Tickets y Auditoría"
        >
          <div className="relative">
            <Camera className={`w-5 h-5 ${activeTab === 'audit' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
            {needsReviewCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white font-bold text-[10px] rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center shadow-xs">
                {needsReviewCount}
              </span>
            )}
            {activeTab === 'audit' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-1">Tickets</span>
        </button>

        {/* Tab 4: División Familiar */}
        <button
          onClick={() => setActiveTab('splits')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl transition-all active:scale-95 touch-manipulation ${
            activeTab === 'splits'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Ir a División Familiar"
        >
          <div className="relative">
            <Users className={`w-5 h-5 ${activeTab === 'splits' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
            {activeTab === 'splits' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
            )}
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-1">División</span>
        </button>
      </div>
    </nav>
  );
};
