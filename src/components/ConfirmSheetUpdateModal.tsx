import React from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Google Sheets Write Confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {description}
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-500 font-sans">
            <span>Target Spreadsheet:</span>
            <span className="font-semibold text-slate-800">{sheetName}</span>
          </div>
          <div className="flex justify-between text-slate-500 font-sans">
            <span>Target Row:</span>
            <span className="font-semibold text-slate-800">Row #{affectedRow}</span>
          </div>
          <div className="flex justify-between text-slate-500 font-sans">
            <span>New Status Value:</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {newValue}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs disabled:opacity-60 flex items-center gap-2"
          >
            {isLoading ? (
              <span>Updating Sheet...</span>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Update Sheet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
