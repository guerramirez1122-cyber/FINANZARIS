/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Deuda, TipoDeuda, Moneda } from '../types/debt';
import { X, ShieldAlert, DollarSign, Calendar, Percent, Tag, HelpCircle } from 'lucide-react';

interface AddEditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deuda: Deuda) => void;
  initialDebt?: Deuda | null;
}

export const AddEditDebtModal: React.FC<AddEditDebtModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDebt,
}) => {
  const [acreedor, setAcreedor] = useState('');
  const [tipoDeuda, setTipoDeuda] = useState<TipoDeuda>('estatica_interes');
  const [moneda, setMoneda] = useState<Moneda>('ARS');
  const [saldoActual, setSaldoActual] = useState<string>('');
  const [tasaInteresAnual, setTasaInteresAnual] = useState<string>('0');
  const [pagoMinimo, setPagoMinimo] = useState<string>('');
  const [cuotasRestantes, setCuotasRestantes] = useState<string>('12');
  const [incluirRiesgoCambiario, setIncluirRiesgoCambiario] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDebt) {
      setAcreedor(initialDebt.acreedor);
      setTipoDeuda(initialDebt.tipo_deuda);
      setMoneda(initialDebt.moneda);
      setSaldoActual(String(initialDebt.saldo_actual));
      setTasaInteresAnual(String(initialDebt.tasa_interes_anual));
      setPagoMinimo(String(initialDebt.pago_minimo));
      setCuotasRestantes(String(initialDebt.cuotas_restantes));
      setIncluirRiesgoCambiario(initialDebt.incluir_riesgo_cambiario);
    } else {
      setAcreedor('');
      setTipoDeuda('estatica_interes');
      setMoneda('ARS');
      setSaldoActual('');
      setTasaInteresAnual('85');
      setPagoMinimo('');
      setCuotasRestantes('6');
      setIncluirRiesgoCambiario(true);
    }
    setError(null);
  }, [initialDebt, isOpen]);

  // Si cambia a cuotas sin interés, forzar tasa 0%
  const handleTipoDeudaChange = (newTipo: TipoDeuda) => {
    setTipoDeuda(newTipo);
    if (newTipo === 'cuotas_sin_interes') {
      setTasaInteresAnual('0');
    } else if (newTipo === 'amigo_inflacion') {
      setTasaInteresAnual('0'); // 0% sobre IPC por defecto
    } else if (tasaInteresAnual === '0') {
      setTasaInteresAnual(moneda === 'EUR' ? '5.0' : '85.0');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acreedor.trim()) {
      setError('Por favor indica el nombre del acreedor o entidad.');
      return;
    }

    const saldo = parseFloat(saldoActual);
    if (isNaN(saldo) || saldo <= 0) {
      setError('El saldo actual debe ser un número positivo.');
      return;
    }

    const min = parseFloat(pagoMinimo);
    if (isNaN(min) || min < 0) {
      setError('El pago mínimo / cuota mensual debe ser igual o mayor a cero.');
      return;
    }

    const tasa = tipoDeuda === 'cuotas_sin_interes' ? 0 : parseFloat(tasaInteresAnual);
    if (isNaN(tasa) || tasa < 0) {
      setError('La tasa de interés debe ser un porcentaje válido mayor o igual a cero.');
      return;
    }

    const cuotas = parseInt(cuotasRestantes, 10);
    if (isNaN(cuotas) || cuotas <= 0) {
      setError('Debe quedar al menos 1 cuota restante.');
      return;
    }

    const deudaToSave: Deuda = {
      id_deuda: initialDebt ? initialDebt.id_deuda : `debt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      acreedor: acreedor.trim(),
      tipo_deuda: tipoDeuda,
      moneda,
      saldo_actual: saldo,
      tasa_interes_anual: tasa,
      pago_minimo: min,
      cuotas_restantes: cuotas,
      incluir_riesgo_cambiario: moneda === 'EUR' ? incluirRiesgoCambiario : false,
    };

    onSave(deudaToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialDebt ? 'Editar Pasivo Financiero' : 'Registrar Nueva Deuda'}
              </h3>
              <p className="text-xs text-slate-500">
                Parámetros para optimización por Método Avalancha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Acreedor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Acreedor o Concepto
            </label>
            <input
              type="text"
              value={acreedor}
              onChange={(e) => setAcreedor(e.target.value)}
              placeholder="Ej: Tarjeta Visa Santander, Préstamo Tío Mateo, Heladera Frávega"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          {/* Tipo de Deuda & Divisa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tipo de Deuda</span>
              </label>
              <select
                value={tipoDeuda}
                onChange={(e) => handleTipoDeudaChange(e.target.value as TipoDeuda)}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                <option value="estatica_interes">Interés Fijo / Rotativo</option>
                <option value="cuotas_sin_interes">Cuotas Fijas Sin Interés (0%)</option>
                <option value="amigo_inflacion">Amigo/Familiar (Indexado a IPC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <span>Moneda de la Deuda</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMoneda('ARS')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    moneda === 'ARS'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ARS ($ Pesos)
                </button>
                <button
                  type="button"
                  onClick={() => setMoneda('EUR')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    moneda === 'EUR'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  EUR (€ Euros)
                </button>
              </div>
            </div>
          </div>

          {/* Saldo Actual & Pago Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Saldo Actual Pendiente ({moneda})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">
                  {moneda === 'EUR' ? '€' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  value={saldoActual}
                  onChange={(e) => setSaldoActual(e.target.value)}
                  placeholder="Ej: 450000"
                  className="w-full text-xs sm:text-sm pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pago Mínimo Obligatorio ({moneda})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">
                  {moneda === 'EUR' ? '€' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  value={pagoMinimo}
                  onChange={(e) => setPagoMinimo(e.target.value)}
                  placeholder="Ej: 45000"
                  className="w-full text-xs sm:text-sm pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tasa Interés Anual & Cuotas Restantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tasa Anual Nominal (TNA %)</span>
                </span>
                {tipoDeuda === 'cuotas_sin_interes' && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    0% Sin Interés
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.1"
                disabled={tipoDeuda === 'cuotas_sin_interes'}
                value={tipoDeuda === 'cuotas_sin_interes' ? '0' : tasaInteresAnual}
                onChange={(e) => setTasaInteresAnual(e.target.value)}
                placeholder={moneda === 'EUR' ? '5.0' : '90.0'}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900 disabled:opacity-50 disabled:bg-slate-100"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {tipoDeuda === 'amigo_inflacion' 
                  ? 'Sobretasa por encima del IPC (0% = puro IPC)' 
                  : 'TNA nominal anual informada por el banco'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Cuotas / Meses Restantes</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={cuotasRestantes}
                onChange={(e) => setCuotasRestantes(e.target.value)}
                placeholder="Ej: 6"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                required
              />
            </div>
          </div>

          {/* Toggle Riesgo Cambiario (EUR) */}
          {moneda === 'EUR' && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Incluir Prima de Riesgo Cambiario</span>
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Suma sobretasa por volatilidad del Euro y brecha cambiaria para calcular el costo real pesificado.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={incluirRiesgoCambiario}
                  onChange={(e) => setIncluirRiesgoCambiario(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all touch-manipulation active:scale-95"
            >
              {initialDebt ? 'Guardar Cambios' : 'Registrar en Avalancha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
