/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Deuda, VariablesMacroeconomicas } from '../types/debt';
import { 
  calcularAvalanchaMultidivisa 
} from '../utils/debtAvalancheCalculations';
import { 
  fetchVariablesMacroeconomicas, 
  DEFAULT_MACRO_VARIABLES 
} from '../services/macroEconomicsService';
import { AddEditDebtModal } from './AddEditDebtModal';
import { 
  Flame, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  DollarSign, 
  Euro, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Pencil, 
  Trash2, 
  HelpCircle,
  PiggyBank,
  Info,
  Layers,
  Zap
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface DebtsDashboardViewProps {
  debts: Deuda[];
  onUpdateDebts: (newDebts: Deuda[]) => void;
  onNavigateTab: (tab: any) => void;
}

export const DebtsDashboardView: React.FC<DebtsDashboardViewProps> = ({
  debts,
  onUpdateDebts,
  onNavigateTab,
}) => {
  const [macro, setMacro] = useState<VariablesMacroeconomicas>(DEFAULT_MACRO_VARIABLES);
  const [isRefreshingMacro, setIsRefreshingMacro] = useState(false);
  const [macroNotice, setMacroNotice] = useState<string | null>(null);

  // Excedente de dinero disponible a fin de mes (para simulación de avalancha)
  const [excedenteArs, setExcedenteArs] = useState<number>(250000);

  // Modal para agregar o editar deuda
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Deuda | null>(null);

  // Filtro de visualización
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'liquefied'>('all');

  // Cargar variables macroeconómicas al montar el componente
  useEffect(() => {
    let isMounted = true;
    async function loadMacro() {
      setIsRefreshingMacro(true);
      try {
        const data = await fetchVariablesMacroeconomicas(false);
        if (isMounted) {
          setMacro(data);
        }
      } catch {
        // Mantiene default
      } finally {
        if (isMounted) setIsRefreshingMacro(false);
      }
    }
    loadMacro();
    return () => { isMounted = false; };
  }, []);

  const handleRefreshMacro = async () => {
    setIsRefreshingMacro(true);
    setMacroNotice(null);
    try {
      const fresh = await fetchVariablesMacroeconomicas(true);
      setMacro(fresh);
      setMacroNotice(`Cotizaciones actualizadas (${fresh.fuente_cotizacion})`);
      setTimeout(() => setMacroNotice(null), 4000);
    } catch {
      setMacroNotice('No se pudo conectar a la API en vivo; usando estimaciones de contingencia.');
      setTimeout(() => setMacroNotice(null), 4000);
    } finally {
      setIsRefreshingMacro(false);
    }
  };

  // Ejecutar el motor de optimización Avalancha Multidivisa
  const resultadoAvalancha = useMemo(() => {
    return calcularAvalanchaMultidivisa(debts, macro, excedenteArs);
  }, [debts, macro, excedenteArs]);

  // Manejadores CRUD de deudas
  const handleSaveDebt = (savedDebt: Deuda) => {
    const exists = debts.some((d) => d.id_deuda === savedDebt.id_deuda);
    let updated: Deuda[];
    if (exists) {
      updated = debts.map((d) => (d.id_deuda === savedDebt.id_deuda ? savedDebt : d));
    } else {
      updated = [savedDebt, ...debts];
    }
    onUpdateDebts(updated);
    setEditingDebt(null);
  };

  const handleDeleteDebt = (id: string) => {
    const updated = debts.filter((d) => d.id_deuda !== id);
    onUpdateDebts(updated);
  };

  const handleMarkAsPaid = (deuda: Deuda) => {
    const updated = debts.filter((d) => d.id_deuda !== deuda.id_deuda);
    onUpdateDebts(updated);
  };

  // Filtrado de la lista
  const deudasFiltradas = useMemo(() => {
    if (activeFilter === 'critical') {
      return resultadoAvalancha.deudas_priorizadas.filter((d) => d.costo_financiero_real_anual > 0);
    }
    if (activeFilter === 'liquefied') {
      return resultadoAvalancha.deudas_priorizadas.filter((d) => d.costo_financiero_real_anual <= 0);
    }
    return resultadoAvalancha.deudas_priorizadas;
  }, [resultadoAvalancha.deudas_priorizadas, activeFilter]);

  return (
    <div className="space-y-6 pb-20">
      {/* ===================================================================== */}
      {/* 1. HEADER & MACRO TICKER BAR                                          */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 fill-rose-500 shrink-0" />
              <span>Avalancha de Deudas</span>
            </h1>
            <span className="text-[10px] sm:text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100 shrink-0">
              Multidivisa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Optimización matemática por Costo Financiero Real (Fisher) bimonetario (ARS / EUR).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefreshMacro}
            disabled={isRefreshingMacro}
            className="min-h-[40px] sm:min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs active:scale-95 touch-manipulation disabled:opacity-50"
            title="Actualizar cotización Euro e Inflación desde DolarApi / ArgentinaDatos"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshingMacro ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar Tasas</span>
          </button>

          <button
            onClick={() => {
              setEditingDebt(null);
              setIsModalOpen(true);
            }}
            className="min-h-[40px] sm:min-h-[44px] flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 touch-manipulation"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Deuda</span>
          </button>
        </div>
      </div>

      {/* Macro Ticker Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-md border border-slate-800 max-w-full overflow-hidden">
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] block leading-tight">Euro Libre / Oficial</span>
                <strong className="font-mono text-emerald-300 text-xs sm:text-sm font-bold truncate block">
                  ${macro.tipo_cambio_eur_ars.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] block leading-tight">Inflación Anual Est.</span>
                <strong className="font-mono text-amber-300 text-xs sm:text-sm font-bold truncate block">
                  {macro.inflacion_anual_estimada.toFixed(1)}% ({macro.inflacion_mensual_estimada.toFixed(1)}%/m)
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] block leading-tight">Devaluación Est. EUR</span>
                <strong className="font-mono text-indigo-300 text-xs sm:text-sm font-bold truncate block">
                  {macro.devaluacion_anual_eur_ars.toFixed(1)}%
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-slate-400 text-[10px] block leading-tight">Riesgo Cambiario</span>
                <span className="font-mono text-slate-200 text-xs sm:text-sm font-semibold truncate block">
                  +{macro.tasa_riesgo_cambiario_anual.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono truncate pt-1 border-t border-slate-800/80">
            Fuente: {macro.fuente_cotizacion.split('(')[0]} · {macro.fuente_inflacion.split('(')[0]}
          </div>
        </div>

        {macroNotice && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-300 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{macroNotice}</span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. CONSOLIDATED PORTFOLIO KPI CARDS                                   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Deuda Total Equivalente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider truncate">
            Deuda Total
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900 mt-1 truncate">
            ${resultadoAvalancha.resumen_cartera.deuda_total_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 truncate">
            <span>En EUR:</span>
            <strong className="font-mono text-indigo-600 truncate">
              €{resultadoAvalancha.resumen_cartera.deuda_total_eur.toLocaleString('es-AR')}
            </strong>
          </div>
        </div>

        {/* Card 2: Mínimos Mensuales Obligatorios */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider truncate">
            Mínimo Mensual
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-rose-600 mt-1 truncate">
            ${resultadoAvalancha.resumen_cartera.pago_minimo_total_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Para evitar mora
          </div>
        </div>

        {/* Card 3: Deuda Crítica Urgente (CFR > 0) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider flex items-center justify-between">
            <span className="truncate">Punta Avalancha</span>
            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0 ml-1" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-rose-700 mt-1 truncate">
            ${resultadoAvalancha.resumen_cartera.deuda_critica_urgente_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1 truncate">
            {resultadoAvalancha.resumen_cartera.deuda_critica_urgente_ars > 0 
              ? 'Liquidar urgente' 
              : '✓ Sin usura'}
          </div>
        </div>

        {/* Card 4: Deuda Licuándose por Inflación (CFR < 0) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs min-w-0">
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider flex items-center justify-between">
            <span className="truncate">Licuación</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 mt-1 truncate">
            ${resultadoAvalancha.resumen_cartera.deuda_licuandose_ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1 truncate">
            Pagar solo mínimo
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. SIMULADOR INTERACTIVO DE EXCEDENTE (AVALANCHA ENGINE)             */}
      {/* ===================================================================== */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sliders className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Simulador de Excedente de Fin de Mes
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Indica cuánto dinero libre tienes este mes tras cubrir los gastos básicos del hogar.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Rápido:</span>
            {[100000, 250000, 500000, 1000000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setExcedenteArs(val)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition-all ${
                  excedenteArs === val
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ${(val / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Input & Range Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Desliza para ajustar excedente disponible:</span>
              <span className="font-mono font-bold text-indigo-600">
                ${excedenteArs.toLocaleString('es-AR')} ARS
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2000000"
              step="25000"
              value={excedenteArs}
              onChange={(e) => setExcedenteArs(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$0 ARS</span>
              <span>$1.000.000 ARS</span>
              <span>$2.000.000 ARS</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between">
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              Monto Exacto (ARS)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                $
              </span>
              <input
                type="number"
                step="5000"
                min="0"
                value={excedenteArs}
                onChange={(e) => setExcedenteArs(Math.max(0, Number(e.target.value)))}
                className="w-full text-base font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Strategic Dictum Banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-indigo-100/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-indigo-950 uppercase tracking-wide">
                Dictamen Estratégico de la Avalancha
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {resultadoAvalancha.plan_excedente.dictamen_estrategico}
              </p>
            </div>
          </div>

          {/* Special Advice for Negative Real Rates (Cuotas sin interés en ARS) */}
          {resultadoAvalancha.plan_excedente.excedente_destinado_a_inversion_ars > 0 && (
            <div className="mt-3.5 pt-3 border-t border-indigo-100 flex items-start gap-2.5 text-xs text-emerald-900 bg-emerald-50/80 p-3 rounded-xl">
              <PiggyBank className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Regla Anti-Quema de Capital: </strong>
                <span>
                  Tienes <strong>${resultadoAvalancha.plan_excedente.excedente_destinado_a_inversion_ars.toLocaleString('es-AR')} ARS</strong> que NO deben usarse para adelantar cuotas sin interés. Al colocar ese capital en Fondos Money Market o Plazos Fijos con tasa ~{macro.tasa_libre_riesgo_ars}% anual, los rendimientos pagarán las cuotas futuras mientras la inflación licúa el capital restante.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payoff Allocation Breakdown Table / Cards */}
        {resultadoAvalancha.plan_excedente.asignaciones.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Plan de Pagos Sugerido Este Mes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resultadoAvalancha.plan_excedente.asignaciones.map((asig, idx) => (
                <div
                  key={asig.id_deuda}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:bg-white hover:border-indigo-200 transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 pb-1.5 border-b border-slate-200/60">
                      <span className="truncate pr-2">{asig.acreedor}</span>
                      <span className="font-mono text-[11px] text-slate-500 shrink-0">
                        {asig.moneda_original}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Mínimo Obligatorio:</span>
                        <strong className="font-mono text-slate-700">
                          ${asig.pago_minimo_ars.toLocaleString('es-AR')} ARS
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Extra Avalancha:</span>
                        <strong className={`font-mono ${asig.pago_extra_ars > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          {asig.pago_extra_ars > 0 ? `+$${asig.pago_extra_ars.toLocaleString('es-AR')}` : '$0'}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                      <span className="text-indigo-900">Total a Pagar este mes:</span>
                      <span className="font-mono text-indigo-600 text-sm">
                        ${asig.pago_total_sugerido_ars.toLocaleString('es-AR')} ARS
                        {asig.moneda_original === 'EUR' && (
                          <span className="text-[11px] text-slate-500 ml-1 font-normal">
                            (€{asig.pago_total_moneda_original})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{asig.motivo_asignacion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 4. RANKING DETALLADO DE DEUDAS (MÉTODO AVALANCHA)                     */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4.5 h-4.5 text-rose-500" />
              <span>Priorización por Costo Financiero Real (CFR)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordenadas de mayor a menor tasa real ajustada por inflación y riesgo cambiario.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({debts.length})
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'critical'
                  ? 'bg-rose-500 text-white shadow-2xs font-bold'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Críticas ({debts.filter(d => (d.tipo_deuda === 'estatica_interes' && d.tasa_interes_anual > 0) || d.moneda === 'EUR').length})
            </button>
            <button
              onClick={() => setActiveFilter('liquefied')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'liquefied'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Licuándose ({debts.filter(d => d.tipo_deuda === 'cuotas_sin_interes' && d.moneda === 'ARS').length})
            </button>
          </div>
        </div>

        {/* Empty State */}
        {deudasFiltradas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No hay deudas en esta categoría
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No tienes pasivos activos registrados bajo este filtro. Registra tus tarjetas, cuotas o préstamos familiares para ver la avalancha en acción.
            </p>
            <button
              onClick={() => {
                setEditingDebt(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Deuda</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {deudasFiltradas.map((deuda) => {
              const esPunta = deuda.orden_prioridad === 1 && deuda.costo_financiero_real_anual > 0;
              const esLicuacion = deuda.costo_financiero_real_anual <= 0;

              return (
                <div
                  key={deuda.id_deuda}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all shadow-xs ${
                    esPunta 
                      ? 'border-rose-300 ring-2 ring-rose-100' 
                      : esLicuacion 
                      ? 'border-emerald-200' 
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Rank Badge, Title, Currency Tag */}
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        esPunta 
                          ? 'bg-rose-500 text-white' 
                          : esLicuacion 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-indigo-600 text-white'
                      }`}>
                        #{deuda.orden_prioridad}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            {deuda.acreedor}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            deuda.moneda === 'EUR'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {deuda.moneda}
                          </span>
                          {deuda.tipo_deuda === 'cuotas_sin_interes' && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                              0% Sin Interés
                            </span>
                          )}
                          {deuda.moneda === 'EUR' && deuda.incluir_riesgo_cambiario && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              <span>Riesgo Cambiario Activo</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>
                            Cuotas restantes: <strong className="text-slate-800">{deuda.cuotas_restantes}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Mínimo mensual: <strong className="font-mono text-slate-800">${deuda.pago_minimo_ars.toLocaleString('es-AR')} ARS</strong>
                            {deuda.moneda === 'EUR' && (
                              <span className="text-slate-400 ml-1">(€{deuda.pago_minimo})</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Rates & Priority Recommendation Badge */}
                    <div className="flex flex-wrap sm:flex-col items-end gap-2 text-right">
                      <div className="flex items-center gap-2">
                        {deuda.recomendacion === 'ACELERAR_PAGO' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl">
                            <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            <span>Punta Avalancha: Acelerar</span>
                          </span>
                        )}
                        {deuda.recomendacion === 'PAGAR_MINIMO_ESTRICTO' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pagar solo Mínimo (Licuación)</span>
                          </span>
                        )}
                        {deuda.recomendacion === 'MONITOREAR_AJUSTE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Monitorear Ajuste</span>
                          </span>
                        )}
                      </div>

                      <div className="text-right flex items-center sm:block gap-3">
                        <div className="text-xs text-slate-400">
                          TNA Nom: <strong className="font-mono text-slate-600">{deuda.tasa_nominal_anual_efectiva.toFixed(1)}%</strong>
                        </div>
                        <div className="text-sm font-bold font-mono">
                          <span className="text-[11px] font-sans font-medium text-slate-500 mr-1">CFR Real Fisher:</span>
                          <span className={deuda.costo_financiero_real_anual > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {deuda.costo_financiero_real_anual > 0 ? '+' : ''}
                            {deuda.costo_financiero_real_anual.toFixed(1)}% anual
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Justification & Action Bar */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed max-w-2xl">
                      {deuda.justificacion}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleMarkAsPaid(deuda)}
                        className="px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors font-medium flex items-center gap-1"
                        title="Marcar como cancelada totalmente"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pagada</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingDebt(deuda);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Editar parámetros de la deuda"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteDebt(deuda.id_deuda)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Crear / Editar Deuda */}
      <AddEditDebtModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDebt(null);
        }}
        onSave={handleSaveDebt}
        initialDebt={editingDebt}
      />
    </div>
  );
};
