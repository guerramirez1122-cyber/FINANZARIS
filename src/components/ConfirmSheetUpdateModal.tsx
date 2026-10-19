import React from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, X, Loader2 } from 'lucide-react';

interface ConfirmSheetUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  sheetName: string;
  affectedRow: string | number;
  newValue: string;
  isLoading?: boolean;
}

export const ConfirmSheetUpdateModal: React.FC<ConfirmSheetUpdateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  sheetName,
  affectedRow,
  newValue,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 safe-area-pb">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Confirmación de Escritura en Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {description}
        </p>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-500 font-sans">
            <span>Hoja de Cálculo:</span>
            <span className="font-semibold text-slate-800">{sheetName}</span>
          </div>
          <div className="flex justify-between text-slate-500 font-sans">
            <span>Fila a Actualizar:</span>
            <span className="font-semibold text-slate-800">Fila #{affectedRow}</span>
          </div>
          <div className="flex justify-between text-slate-500 font-sans">
            <span>Nuevo Estado:</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {newValue}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors text-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-60 flex items-center justify-center gap-2 text-center active:scale-95 touch-manipulation"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Actualizando Fila...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Actualizar Sheet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
