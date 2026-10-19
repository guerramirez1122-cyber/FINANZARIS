import React, { useState, useRef } from 'react';
import { 
  ExpenseTicket, 
  FamilyMember, 
  ExpenseCategory, 
  SplitType, 
  TicketItem 
} from '../types/expense';
import { 
  X, 
  Sparkles, 
  Camera, 
  UploadCloud, 
  Check, 
  Receipt, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTicket: (ticket: ExpenseTicket) => void;
  members: FamilyMember[];
  categories: ExpenseCategory[];
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({
  isOpen,
  onClose,
  onAddTicket,
  members,
  categories,
}) => {
  if (!isOpen) return null;

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Groceries & Market');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidBy, setPaidBy] = useState(members[0]?.id || 'mem_elena');
  const [splitType, setSplitType] = useState<SplitType>('parents_only');
  const [taxAmount, setTaxAmount] = useState('0');
  const [aiConfidence, setAiConfidence] = useState(96);
  const [items, setItems] = useState<TicketItem[]>([
    { id: 'item-1', description: 'General Items', quantity: 1, unitPrice: 0, lineTotal: 0 },
  ]);

  // Image capture & OCR states
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSuccessMessage, setOcrSuccessMessage] = useState<string | null>(null);
  const [ocrErrorMessage, setOcrErrorMessage] = useState<string | null>(null);

  // Native camera input with capture="environment" (rear mobile camera)
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset messages
    setOcrSuccessMessage(null);
    setOcrErrorMessage(null);
    setIsOcrProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      setCapturedImagePreview(base64Data);

      try {
        const response = await fetch('/api/ocr-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (data.merchant) setMerchant(data.merchant);
            if (data.amount !== undefined) setAmount(Number(data.amount).toFixed(2));
            if (data.taxAmount !== undefined) setTaxAmount(Number(data.taxAmount).toFixed(2));
            if (data.date) setDate(data.date);
            if (data.category) setCategory(data.category);
            if (data.aiConfidence) setAiConfidence(data.aiConfidence);
            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items);
            }
            setOcrSuccessMessage(`¡Ticket analizado con éxito por Gemini! Comercio: "${data.merchant || 'Detectado'}", Total: $${Number(data.amount || 0).toFixed(2)}`);
          } else {
            throw new Error(data.error || 'No se pudieron extraer datos del ticket');
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor HTTP ${response.status}`);
        }
      } catch (err: any) {
        console.warn('Error llamando a Gemini OCR:', err);
        setOcrErrorMessage('No se pudieron extraer los datos automáticamente. Por favor revisa y completa los campos abajo.');
        // Set fallback friendly initial values based on image capture
        if (!merchant) setMerchant('Comercio Ticket');
      } finally {
        setIsOcrProcessing(false);
      }
    };
    reader.onerror = () => {
      setIsOcrProcessing(false);
      setOcrErrorMessage('Error al leer el archivo de imagen de la cámara.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0 || !merchant.trim()) return;

    let splitWith: string[] = [];
    if (splitType === 'parents_only') {
      splitWith = ['mem_elena', 'mem_carlos'];
    } else if (splitType === 'equal_all') {
      splitWith = members.map((m) => m.id);
    } else {
      splitWith = [paidBy];
    }

    const newTicket: ExpenseTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      merchant: merchant.trim(),
      category,
      amount: parsedAmount,
      taxAmount: parseFloat(taxAmount) || 0,
      tipAmount: 0,
      paidByMemberId: paidBy,
      splitType,
      splitWithMemberIds: splitWith,
      items: items.length > 0 ? items : [{ id: 'i1', description: merchant, quantity: 1, unitPrice: parsedAmount, lineTotal: parsedAmount }],
      aiConfidence,
      status: aiConfidence >= 90 ? 'verified' : 'needs_review',
      source: capturedImagePreview ? 'mobile_camera' : 'ai_ocr_pipeline',
      sheetRowIndex: 154,
      tags: [capturedImagePreview ? 'Cámara Móvil Trasera' : 'Manual / Upload Ingest'],
      aiNotes: `Ingested via FamilyLedger OCR simulator with ${aiConfidence}% confidence rating.`,
    };

    onAddTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      {/* Mobile-friendly bottom-sheet container */}
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto safe-area-pb">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden" />

        {/* Hidden Native File Inputs */}
        {/* Input 1: Camera rear environment */}
        <input 
          ref={cameraInputRef}
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleImageFileChange}
          aria-label="Capturar ticket con cámara trasera"
        />
        {/* Input 2: Gallery picker */}
        <input 
          ref={galleryInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageFileChange}
          aria-label="Seleccionar foto de galería"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Escanear Ticket / Gasto</h2>
            <p className="text-xs text-slate-500">
              Abre la cámara trasera de tu móvil o selecciona una foto
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Camera Trigger Card (Mobile-First with >= 48px touch targets) */}
        <div className="bg-indigo-50/70 border-2 border-dashed border-indigo-300 rounded-2xl p-4 text-center space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {/* Primary Action Button: Opens rear camera directly via capture="environment" */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-transform active:scale-[0.98] touch-manipulation"
            >
              <Camera className="w-5 h-5 shrink-0" />
              <span>Tomar Foto con Cámara Trasera</span>
            </button>

            {/* Secondary Action: Select from photo gallery */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-full sm:w-auto min-h-[48px] px-4 py-3 bg-white hover:bg-indigo-50/50 text-indigo-700 border border-indigo-200 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-colors active:scale-[0.98] touch-manipulation"
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>Elegir de Galería</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Utiliza la cámara trasera de tu teléfono para enfocar el recibo con buena iluminación.
          </p>

          {/* OCR Processing State */}
          {isOcrProcessing && (
            <div className="p-3 bg-white/80 rounded-xl border border-indigo-200 flex items-center justify-center gap-2 text-indigo-700 text-xs font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Gemini Vision analizando ticket y extrayendo conceptos...</span>
            </div>
          )}

          {/* OCR Error / Manual Warning */}
          {ocrErrorMessage && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-amber-900 text-xs font-medium text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{ocrErrorMessage}</span>
            </div>
          )}

          {/* Scanned Image Preview Thumbnail */}
          {capturedImagePreview && (
            <div className="relative inline-block mt-1">
              <img 
                src={capturedImagePreview} 
                alt="Ticket capturado" 
                className="w-24 h-28 object-cover rounded-xl border-2 border-indigo-400 shadow-md mx-auto"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                Ticket Capturado
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Comercio / Tienda</label>
              <input
                type="text"
                required
                placeholder="ej. Costco, Supermercado..."
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 font-medium min-h-[48px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Total a Pagar ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 font-mono font-bold min-h-[48px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 min-h-[48px]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Pagado Por</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 min-h-[48px]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Regla de División</label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 min-h-[48px]"
              >
                <option value="parents_only">Padres 50/50 Fondo Común</option>
                <option value="equal_all">Todos por Igual (Familia)</option>
                <option value="personal">100% Gasto Personal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Fecha del Recibo</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 font-mono min-h-[48px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Confianza IA ({aiConfidence}%)</label>
              <div className="pt-2">
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={aiConfidence}
                  onChange={(e) => setAiConfidence(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Line items preview as cards on small screens */}
          {items.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-800">
                Conceptos Detectados ({items.length})
              </div>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-sans text-slate-700 truncate max-w-[200px] sm:max-w-[280px]">
                      {item.description}
                    </span>
                    <span className="text-slate-900 font-semibold tabular-nums">
                      ${item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action Buttons with >= 48px touch targets */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] text-center"
            >
              Guardar e Ingresar a Google Sheets
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
