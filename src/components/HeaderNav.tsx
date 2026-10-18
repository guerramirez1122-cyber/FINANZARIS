import React from 'react';
import { Plus, CheckCircle2, User as UserIcon, Settings2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';

interface HeaderNavProps {
  activeTab: 'overview' | 'audit' | 'splits' | 'improvements' | 'sheets';
  setActiveTab: (tab: 'overview' | 'audit' | 'splits' | 'improvements' | 'sheets') => void;
  onOpenAddModal: () => void;
  onOpenSourcesModal: () => void;
  needsReviewCount: number;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isAuthLoading: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenSourcesModal,
  needsReviewCount,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isAuthLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand title, single line text wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            FL
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors text-left"
          >
            FamilyLedger
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'overview'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Approve & Verify</span>
            {needsReviewCount > 0 && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 rounded px-1.5 py-0.2">
                {needsReviewCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('splits')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
              activeTab === 'splits'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Family Splits
          </button>

          <button
            onClick={() => setActiveTab('improvements')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors flex items-center gap-1.5 ${
              activeTab === 'improvements'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>WhatsApp & Improvements</span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 rounded px-1.5 py-0.2">
              New
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sheets & Form DB</span>
            {googleUser && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connected to Google Workspace" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action + Google connection indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {googleUser ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
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
                title="Sign out of Google"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden sm:block">
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                isLoading={isAuthLoading}
                text="Sign in"
                className="py-1.5 px-3 text-[11px]"
              />
            </div>
          )}

          <button
            onClick={onOpenSourcesModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Connect sources, update family names and numbers"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Sources &amp; Names</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Ticket</span>
          </button>
        </div>
      </div>
    </header>
  );
};
