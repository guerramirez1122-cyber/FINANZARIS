/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderNavProps {
  activeTab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets';
  setActiveTab: (tab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets') => void;
  onOpenAddModal?: () => void;
  onOpenSourcesModal?: () => void;
  needsReviewCount?: number;
  googleUser?: any;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  isAuthLoading?: boolean;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
  isFirestoreLive?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  setActiveTab,
  isFirestoreLive = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 w-full overflow-hidden">
      <div className="w-full max-w-full mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5">
        {/* Left: Brand title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs select-none">
            FL
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-indigo-600 transition-colors text-left"
          >
            FamilyLedger
          </button>
        </div>

        {/* Right: Status badge & PWA install icon */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
              isFirestoreLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title={isFirestoreLive ? 'Bóveda Firestore en tiempo real conectada' : 'Modo Libre de Pruebas (Click para ver ajustes)'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isFirestoreLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isFirestoreLive ? 'En Vivo' : 'Pruebas'}</span>
          </button>
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
