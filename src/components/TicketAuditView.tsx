import React, { useState, useRef } from 'react';
import { 
  ExpenseTicket, 
  FamilyMember, 
  ExpenseCategory, 
  SplitType 
} from '../types/expense';
import { formatCurrency } from '../utils/calculations';
import { 
  Search, 
  Filter, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt, 
  Sparkles, 
  UserCheck, 
  ArrowUpDown, 
  Layers, 
  Tag, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Split,
  FileSpreadsheet,
  Camera,
  ArrowLeft,
  Calendar,
  DollarSign
} from 'lucide-react';

interface TicketAuditViewProps {
  tickets: ExpenseTicket[];
  members: FamilyMember[];
  categories: ExpenseCategory[];
  selectedTicket: ExpenseTicket | null;
  setSelectedTicket: (t: ExpenseTicket | null) => void;
  onUpdateTicket: (updated: ExpenseTicket) => void;
  onDeleteTicket: (id: string) => void;
  onRequestSheetVerification?: (ticket: ExpenseTicket) => void;
  onBatchVerifyAll?: () => void;
  isConnectedToSheet?: boolean;
}

export const TicketAuditView: React.FC<TicketAuditViewProps> = ({
  tickets,
  members,
  categories,
  selectedTicket,
  setSelectedTicket,
  onUpdateTicket,
  onDeleteTicket,
  onRequestSheetVerification,
  onBatchVerifyAll,
  isConnectedToSheet = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'needs_review' | 'verified' | 'high_value'>('needs_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list');

  // Quick camera input with capture="environment" for native phone camera
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Active ticket for detail panel
  const activeTicket = selectedTicket || (tickets.length > 0 ? tickets[0] : null);

  // Filtered tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === 'needs_review' && ticket.status !== 'needs_review' && ticket.status !== 'flagged') return false;
    if (filterStatus === 'verified' && ticket.status !== 'verified') return false;
    if (filterStatus === 'high_value' && ticket.amount < 100) return false;

    if (selectedMemberFilter !== 'all' && ticket.paidByMemberId !== selectedMemberFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMerchant = ticket.merchant.toLowerCase().includes(q);
      const matchCategory = ticket.category.toLowerCase().includes(q);
      const matchItems = ticket.items.some((i) => i.description.toLowerCase().includes(q));
      if (!matchMerchant && !matchCategory && !matchItems) return false;
    }

    return true;
  });

  const pendingCount = tickets.filter((t) => t.status === 'needs_review' || t.status === 'flagged').length;

  const handleVerifyTicket = (ticket: ExpenseTicket) => {
    if (onRequestSheetVerification && isConnectedToSheet) {
      // Trigger confirmation modal for mutating spreadsheet row
      onRequestSheetVerification(ticket);
    } else {
      onUpdateTicket({
        ...ticket,
        status: 'verified',
        aiNotes: (ticket.aiNotes ? ticket.aiNotes + ' · ' : '') + 'Aprobado y verificado el ' + new Date().toLocaleDateString(),
      });
    }
  };

  const handleUpdateSplitType = (ticket: ExpenseTicket, newSplit: SplitType) => {
    let splitWith: string[] = [];
    if (newSplit === 'parents_only') {
      splitWith = ['mem_elena', 'mem_carlos'];
    } else if (newSplit === 'equal_all') {
      splitWith = members.map((m) => m.id);
    } else if (newSplit === 'personal') {
      splitWith = [ticket.paidByMemberId];
    } else {
      splitWith = ticket.splitWithMemberIds;
    }

    onUpdateTicket({
      ...ticket,
      splitType: newSplit,
      splitWithMemberIds: splitWith,
    });
  };

  const handleUpdateCategory = (ticket: ExpenseTicket, newCategory: string) => {
    onUpdateTicket({
      ...ticket,
      category: newCategory,
    });
    setIsEditingCategory(false);
  };

  const handleUpdatePayer = (ticket: ExpenseTicket, newPayerId: string) => {
    onUpdateTicket({
      ...ticket,
      paidByMemberId: newPayerId,
    });
  };

  const handleQuickCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const randomTotal = (15 + Math.random() * 70).toFixed(2);
    const newTicket: ExpenseTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      merchant: 'Recibo Cámara Trasera',
      category: 'Groceries & Market',
      amount: parseFloat(randomTotal),
      taxAmount: parseFloat((parseFloat(randomTotal) * 0.08).toFixed(2)),
      tipAmount: 0,
      paidByMemberId: members[0]?.id || 'mem_elena',
      splitType: 'parents_only',
      splitWithMemberIds: ['mem_elena', 'mem_carlos'],
      items: [{ id: `cam-${Date.now()}`, description: 'Compra capturada con cámara', quantity: 1, unitPrice: parseFloat(randomTotal), lineTotal: parseFloat(randomTotal) }],
      aiConfidence: 97,
      status: 'needs_review',
      source: 'mobile_camera',
      sheetRowIndex: 155,
      tags: ['Cámara Trasera'],
      aiNotes: 'Capturado al instante con la cámara del celular.',
    };

    onUpdateTicket(newTicket);
    setSelectedTicket(newTicket);
    setMobileTab('detail');
  };

  return (
    <div className="space-y-6">
      {/* Hidden Native Camera Input with capture="environment" */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleQuickCameraCapture}
        aria-label="Capturar ticket con cámara trasera"
      />

      {/* Header & Purpose */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Gestor de Tickets</span>
            <span aria-hidden="true">·</span>
            <span>Aprobación y Verificación de Gastos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Revisión y Auditoría de Tickets
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Revisa tickets capturados desde Google Sheets, WhatsApp o cámara móvil.
          </p>
        </div>

        {/* Quick Actions with >= 48px touch targets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mobile Rear Camera Instant Button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 sm:flex-initial min-h-[48px] px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
          >
            <Camera className="w-4 h-4" />
            <span>Foto con Cámara</span>
          </button>

          {pendingCount > 0 && onBatchVerifyAll && (
            <button
              onClick={onBatchVerifyAll}
              className="min-h-[48px] px-4 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95 touch-manipulation"
            >
              <Check className="w-4 h-4" />
              <span>Aprobar Todos ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Filter Pills with min-h-[48px] */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl min-h-[48px] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('needs_review')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'needs_review'
                ? 'bg-white text-amber-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'verified'
                ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verificados
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`min-h-[40px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({tickets.length})
          </button>
        </div>

        {/* Search and Member Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar comercio o producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-base sm:text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-indigo-500 shadow-2xs min-h-[48px]"
            />
          </div>

          <select
            value={selectedMemberFilter}
            onChange={(e) => setSelectedMemberFilter(e.target.value)}
            className="py-2.5 px-3 text-base sm:text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-indigo-500 shadow-2xs min-h-[48px]"
          >
            <option value="all">Familiares</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile-Only Tab Switcher between List and Detail when a ticket is chosen */}
      <div className="flex lg:hidden items-center justify-between p-1 bg-slate-100 rounded-xl min-h-[48px]">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'list' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Lista de Tickets ({filteredTickets.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('detail')}
          className={`flex-1 min-h-[40px] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'detail' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Detalle y Auditoría</span>
        </button>
      </div>

      {/* Main Split Grid: Ticket List (5 cols) & Inspector Deck (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Ticket Feed */}
        <div className={`lg:col-span-5 space-y-3 ${mobileTab === 'detail' ? 'hidden lg:block' : 'block'}`}>
          {/* Tickets Cards List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800">No hay tickets que coincidan</h3>
                <p className="text-xs text-slate-500">
                  Prueba limpiando la búsqueda o cambiando de filtro.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = activeTicket?.id === ticket.id;
                const member = members.find((m) => m.id === ticket.paidByMemberId);

                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setMobileTab('detail');
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all active:scale-[0.99] touch-manipulation ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-medium">{ticket.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ticket.date}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {ticket.merchant}
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                          {formatCurrency(ticket.amount)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {ticket.category}
                        </div>
                      </div>
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        {member?.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover border border-slate-200"
                          />
                        ) : null}
                        <span className="font-medium">{member?.name || ticket.paidByMemberId}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{ticket.splitType.replace('_', ' ')}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {ticket.status === 'verified' ? (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verificado</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Revisar</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: AI Receipt Inspector & Audit Desk */}
        <div className={`lg:col-span-7 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
          {/* Back to list button on mobile */}
          <div className="lg:hidden mb-3">
            <button
              onClick={() => setMobileTab('list')}
              className="min-h-[48px] px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              <span>Volver a la lista de tickets</span>
            </button>
          </div>

          {activeTicket ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              {/* Ticket Top bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-700">{activeTicket.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>Fila #{activeTicket.sheetRowIndex || 142}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeTicket.source.replace('_', ' ')}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    {activeTicket.merchant}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {activeTicket.status === 'verified' ? (
                    <div className="min-h-[48px] flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Verificado en Base de Datos</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleVerifyTicket(activeTicket)}
                      className="min-h-[48px] flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md shadow-emerald-600/20 touch-manipulation"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar y Verificar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Extraction Confidence Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  activeTicket.aiConfidence >= 90
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Confianza de Extracción Gemini Vision: {activeTicket.aiConfidence}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {activeTicket.aiNotes || 'Conceptos, montos, impuestos y fecha extraídos con precisión.'}
                    </p>
                    {activeTicket.flags && activeTicket.flags.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        {activeTicket.flags.map((flag, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                      {formatCurrency(activeTicket.amount)}
                    </div>
                    <div className="text-[11px] text-slate-400">Total Facturado</div>
                  </div>
                </div>
              </div>

              {/* Split & Attribution Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Payer selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Pagado Por</label>
                  <select
                    value={activeTicket.paidByMemberId}
                    onChange={(e) => handleUpdatePayer(activeTicket, e.target.value)}
                    className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 font-medium min-h-[48px]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Split type selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Regla de División</label>
                  <select
                    value={activeTicket.splitType}
                    onChange={(e) => handleUpdateSplitType(activeTicket, e.target.value as SplitType)}
                    className="w-full text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-indigo-500 font-medium min-h-[48px]"
                  >
                    <option value="parents_only">Padres 50/50 Fondo Común</option>
                    <option value="equal_all">Todos por Igual (Familia)</option>
                    <option value="personal">100% Gasto Personal</option>
                    <option value="custom">División Personalizada</option>
                  </select>
                </div>
              </div>

              {/* Category Override */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Categoría Asignada</label>
                  <button
                    onClick={() => setIsEditingCategory(!isEditingCategory)}
                    className="min-h-[40px] px-2 text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                  >
                    {isEditingCategory ? 'Listo' : 'Cambiar Categoría'}
                  </button>
                </div>
                {isEditingCategory ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleUpdateCategory(activeTicket, c.name)}
                        className={`min-h-[48px] p-2.5 text-xs rounded-xl text-left border transition-all ${
                          activeTicket.category === c.name
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex items-center justify-between min-h-[48px]">
                    <span className="font-semibold">{activeTicket.category}</span>
                    <span className="text-[11px] text-slate-500">Sobre presupuestario</span>
                  </div>
                )}
              </div>

              {/* Parsed Line Items Table converting to Cards on Small Screens */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">
                    Artículos y Conceptos Extraídos ({activeTicket.items.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Subtotal: {formatCurrency(activeTicket.items.reduce((acc, i) => acc + i.lineTotal, 0))}
                  </span>
                </div>

                {/* Mobile View: Line Items as Stacked Cards (sm:hidden) */}
                <div className="block sm:hidden space-y-2">
                  {activeTicket.items.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-xs text-slate-800">
                          {item.description}
                        </div>
                        <div className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                          {formatCurrency(item.lineTotal)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>Cant: {item.quantity} × {formatCurrency(item.unitPrice)}</span>
                        {item.suggestedCategory && (
                          <span className="text-indigo-600 font-sans font-medium">{item.suggestedCategory}</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Summary Totals on Mobile */}
                  <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl space-y-1.5 text-xs font-mono">
                    {activeTicket.taxAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Impuestos y Recargos:</span>
                        <span>{formatCurrency(activeTicket.taxAmount)}</span>
                      </div>
                    )}
                    {activeTicket.tipAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Propina:</span>
                        <span>{formatCurrency(activeTicket.tipAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                      <span>Total Ticket:</span>
                      <span>{formatCurrency(activeTicket.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop View: Traditional Table (hidden sm:block) */}
                <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3 text-center">Cant.</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {activeTicket.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-sans text-slate-800">
                            <div>{item.description}</div>
                            {item.suggestedCategory && (
                              <div className="text-[10px] text-indigo-600 font-medium">
                                Cross-category: {item.suggestedCategory}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-900 font-semibold tabular-nums">
                            {formatCurrency(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/60 border-t border-slate-200 text-xs">
                      {activeTicket.taxAmount > 0 && (
                        <tr>
                          <td colSpan={3} className="py-1.5 px-3 text-slate-500 font-sans">
                            Impuestos
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {formatCurrency(activeTicket.taxAmount)}
                          </td>
                        </tr>
                      )}
                      <tr className="font-bold border-t border-slate-200 bg-slate-100/50">
                        <td colSpan={3} className="py-2 px-3 text-slate-900 font-sans">
                          Total General
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 text-sm">
                          {formatCurrency(activeTicket.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action buttons footer with >= 48px touch targets */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
                <button
                  onClick={() => onDeleteTicket(activeTicket.id)}
                  className="w-full sm:w-auto min-h-[48px] text-rose-600 hover:text-rose-700 font-medium px-4 py-2 hover:bg-rose-50 rounded-xl transition-colors text-center"
                >
                  Eliminar Ticket
                </button>
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <button
                    onClick={() => handleVerifyTicket(activeTicket)}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors text-center shadow-xs"
                  >
                    Guardar Cambios y Confirmar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              Selecciona un ticket para inspeccionar conceptos y división.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
