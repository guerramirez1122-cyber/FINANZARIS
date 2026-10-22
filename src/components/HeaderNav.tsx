import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderNavProps {
  activeTab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets';
  setActiveTab: (tab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets') => void;
  onOpenAddModal?: () => void;
  onOpenSourcesModal?: () => void;
  needsReviewCount?: number;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isAuthLoading: boolean;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  setActiveTab,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isAuthLoading,
  isMobileMode = false,
  onToggleMobileMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
        {/* Left: Brand title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
            FL
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors text-left"
          >
            FamilyLedger
          </button>
        </div>

        {/* Right: User Auth and Mobile/Desktop Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {googleUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {googleUser.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
              <button
                onClick={onGoogleSignOut}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                title="Cerrar sesión de Google"
              >
                Salir
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={onGoogleSignIn}
              isLoading={isAuthLoading}
              text="Google"
              className="py-1.5 px-3 text-[11px]"
            />
          )}

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {onToggleMobileMode && (
            <button
              onClick={onToggleMobileMode}
              className={`min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 touch-manipulation ${
                isMobileMode
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title={isMobileMode ? 'Cambiar a vista de escritorio' : 'Ver en formato de app de teléfono móvil'}
            >
              {isMobileMode ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold text-[11px]">Móvil</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-[11px]">Escritorio</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
