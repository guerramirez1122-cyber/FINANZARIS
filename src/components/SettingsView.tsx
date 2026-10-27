import React, { useState } from 'react';
import { 
  Sliders, 
  Users, 
  FileSpreadsheet, 
  RefreshCw, 
  ShieldCheck, 
  Wallet, 
  ChevronRight, 
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Flame,
  Lock,
  Shield,
  KeyRound,
  RotateCcw,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { FamilyMember, ExpenseCategory, HouseholdFinancialPlan } from '../types/expense';
import { User } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  financialPlan: HouseholdFinancialPlan;
  members: FamilyMember[];
  categories: ExpenseCategory[];
  onOpenBudgetSettings: () => void;
  onOpenSourcesModal: () => void;
  onSyncSheets: () => void;
  isSyncing: boolean;
  googleUser: User | null;
  googleAccessToken: string | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isMobileMode: boolean;
  onToggleMobileMode: () => void;
  onNavigateTab?: (tab: 'overview' | 'spending' | 'debts' | 'performance' | 'audit' | 'splits' | 'settings' | 'improvements' | 'sheets') => void;
  isFirestoreLive?: boolean;
  secondaryAuthorizedEmail?: string;
  onUpdateSecondaryEmail?: (email: string) => Promise<void>;
  onResetTrialData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  financialPlan,
  members,
  categories,
  onOpenBudgetSettings,
  onOpenSourcesModal,
  onSyncSheets,
  isSyncing,
  googleUser,
  googleAccessToken,
  onGoogleSignIn,
  onGoogleSignOut,
  isMobileMode,
  onToggleMobileMode,
  onNavigateTab,
  isFirestoreLive = false,
  secondaryAuthorizedEmail = '',
  onUpdateSecondaryEmail,
  onResetTrialData,
}) => {
  const [partnerEmail, setPartnerEmail] = useState(secondaryAuthorizedEmail);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSaveSuccess, setEmailSaveSuccess] = useState(false);

  const handleSavePartnerEmail = async () => {
    if (!onUpdateSecondaryEmail) return;
    setIsSavingEmail(true);
    try {
      await onUpdateSecondaryEmail(partnerEmail);
      setEmailSaveSuccess(true);
      setTimeout(() => setEmailSaveSuccess(false), 3000);
    } finally {
      setIsSavingEmail(false);
    }
  };
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Ajustes del Hogar
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configura tus metas de presupuesto, fuentes de datos, miembros de la familia e integraciones.
        </p>
      </div>

      {/* Section 1: Presupuesto y Metas Financieras */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Presupuesto Familiar</h2>
              <p className="text-xs text-slate-500">
                Límites mensuales, colchón de seguridad y distribución del gasto
              </p>
            </div>
          </div>

          <button
            onClick={onOpenBudgetSettings}
            className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation"
          >
            <span>Configurar Presupuesto</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Budget Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[11px] text-slate-500 font-medium">Presupuesto Mensual</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              ${categories.reduce((acc, c) => acc + c.monthlyBudget, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[11px] text-slate-500 font-medium">Meta Ahorro Mensual</div>
            <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
              ${(financialPlan.targetSavingsMonthly || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[11px] text-slate-500 font-medium">Ingresos Registrados</div>
            <div className="text-lg font-bold font-mono text-indigo-600 mt-0.5">
              ${Object.values(financialPlan.memberEarnings || {}).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[11px] text-slate-500 font-medium">Categorías Activas</div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              {categories.length} categorías
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Fuentes y Miembros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Fuentes &amp; Miembros</h2>
              <p className="text-xs text-slate-500">
                Cuentas bancarias, tarjetas, miembros familiares y sus ingresos
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSourcesModal}
            className="min-h-[44px] px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation"
          >
            <span>Editar Fuentes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Member cards preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-2xs"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{member.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{member.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold font-mono text-slate-800">
                  ${(financialPlan.memberEarnings?.[member.id] || member.monthlyTargetSpend || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Ingreso mensual</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2.5: Bóveda Firestore & Seguridad Familiar (2 Usuarios) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isFirestoreLive ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Bóveda en la Nube &amp; Seguridad</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isFirestoreLive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {isFirestoreLive ? '🔒 Firestore en Vivo' : '🧪 Versión Libre de Pruebas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acceso exclusivo y restringido únicamente para ustedes dos mediante Google Auth y reglas Firestore.
              </p>
            </div>
          </div>

          {onResetTrialData && (
            <button
              type="button"
              onClick={onResetTrialData}
              className="min-h-[40px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 active:scale-95 touch-manipulation"
              title="Restaurar datos de muestra para pruebas libres"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restablecer Datos de Prueba</span>
            </button>
          )}
        </div>

        {/* Authorized Family Emails Whitelist */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Usuarios con Acceso Autorizado (Máx. 2)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary User 1 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    guerramirez1122@gmail.com
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Propietario Principal (Admin)</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                Autorizado
              </span>
            </div>

            {/* Partner User 2 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs font-bold text-slate-900">Segundo Usuario (Pareja)</div>
                </div>
                {partnerEmail && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                    Co-Administrador
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="correo_pareja@gmail.com"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSavePartnerEmail}
                  disabled={isSavingEmail || !partnerEmail}
                  className="min-h-[34px] px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95"
                >
                  {isSavingEmail ? '...' : emailSaveSuccess ? '✓' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Seguridad Zero-Trust:</strong> La base de datos Firestore en Google Cloud rechaza de forma estricta cualquier intento de lectura o modificación que no provenga de uno de estos dos correos autenticados con Google.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Integración de Google Sheets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Sheets &amp; Sincronización</h2>
              <p className="text-xs text-slate-500">
                Sincroniza tickets y categorías con tu hoja de cálculo oficial
              </p>
            </div>
          </div>

          <button
            onClick={onSyncSheets}
            disabled={isSyncing}
            className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-700">
              {googleAccessToken ? 'Conectado a Google Workspace (OAuth 2.0)' : 'Cuenta desconectada'}
            </span>
          </div>

          {googleAccessToken ? (
            <button
              onClick={onGoogleSignOut}
              className="text-xs text-rose-600 font-semibold hover:underline self-start sm:self-auto"
            >
              Cerrar sesión de Google
            </button>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="text-xs text-indigo-600 font-bold hover:underline self-start sm:self-auto"
            >
              Conectar Google Sheets
            </button>
          )}
        </div>
      </div>

      {/* Section 4: Resumen de Rendimiento & Ahorro */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Rendimiento Financiero &amp; Anual</h2>
              <p className="text-xs text-slate-500">
                Visualiza comparativas de ahorro mensual, ingresos vs gastos y vista acumulada anual
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('performance')}
              className="min-h-[44px] px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation"
            >
              <span>Ver Balance</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Section 5: Avalancha Multidivisa de Deudas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Avalancha Multidivisa de Deudas</h2>
              <p className="text-xs text-slate-500">
                Optimización matemática por costo financiero real (Fisher) en ARS y EUR con licuación inflacionaria
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('debts')}
              className="min-h-[44px] px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation"
            >
              <span>Ver Deudas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Section 6: Preferencias de Pantalla */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Simulador Vista Móvil</h3>
          <p className="text-xs text-slate-500">
            Alterna entre el chasis de teléfono móvil y el contenedor ancho de escritorio.
          </p>
        </div>

        <button
          onClick={onToggleMobileMode}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            isMobileMode 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isMobileMode ? 'Modo Móvil Activo' : 'Modo Escritorio'}
        </button>
      </div>

      {/* Section 5: Aplicación Móvil e Instalación (PWA) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>📲 Aplicación Progresiva (PWA)</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Instalable
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instala FamilyLedger en tu pantalla de inicio en Android o iPhone para usarla a pantalla completa y sin conexión.
          </p>
        </div>

        <PWAInstallButton />
      </div>
    </div>
  );
};
