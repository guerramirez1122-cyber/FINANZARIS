import React, { useState } from 'react';
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
  FileSpreadsheet
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
        aiNotes: (ticket.aiNotes ? ticket.aiNotes + ' · ' : '') + 'Approved & verified on ' + new Date().toLocaleDateString(),
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

  return (
    <div className="space-y-6">
      {/* Header & Purpose */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Automated Ingestion Queue</span>
            <span aria-hidden="true">·</span>
            <span>Google Forms & Sheet Auto-Ingest Row Inspector</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Approve & Verify Ticket Desk
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Review captured receipts from your Google Form database, audit item splits, and mark verified.
          </p>
        </div>

        {/* Quick Filter tabs & Batch Verify */}
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && onBatchVerifyAll && (
            <button
              onClick={onBatchVerifyAll}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verify All ({pendingCount})</span>
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setFilterStatus('needs_review')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === 'needs_review'
                  ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === 'verified'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tickets.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Ticket List (5 cols) & Inspector Deck (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Ticket Feed */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Payer Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search merchant or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-indigo-500 shadow-2xs"
              />
            </div>

            <select
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              className="py-2 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-indigo-500 shadow-2xs"
            >
              <option value="all">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tickets Cards List */}
          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800">No tickets match criteria</h3>
                <p className="text-xs text-slate-500">
                  Try clearing the search query or switching filters.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = activeTicket?.id === ticket.id;
                const member = members.find((m) => m.id === ticket.paidByMemberId);

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500 shadow-xs'
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
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          {ticket.merchant}
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          {formatCurrency(ticket.amount)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ticket.category}
                        </div>
                      </div>
                    </div>

                    {/* Metadata line without pills */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        {member?.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : null}
                        <span>{member?.name || ticket.paidByMemberId}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{ticket.splitType.replace('_', ' ')}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {ticket.status === 'verified' ? (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{ticket.aiConfidence}%</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Needs Audit</span>
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
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              {/* Ticket Top bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-700">{activeTicket.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>Sheet Row #{activeTicket.sheetRowIndex || 142}</span>
                    <span aria-hidden="true">·</span>
                    <span>Captured via {activeTicket.source.replace('_', ' ')}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {activeTicket.merchant}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {activeTicket.status === 'verified' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                      <Check className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleVerifyTicket(activeTicket)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Verify</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Extraction Confidence Card */}
              <div
                className={`p-4 rounded-xl border ${
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
                        Gemini Vision Extraction Confidence: {activeTicket.aiConfidence}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {activeTicket.aiNotes || 'Items, totals, tax, and date accurately extracted from receipt.'}
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
                    <div className="text-[11px] text-slate-400">Total Charged</div>
                  </div>
                </div>
              </div>

              {/* Split & Attribution Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Payer selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Paid By Family Member</label>
                  <select
                    value={activeTicket.paidByMemberId}
                    onChange={(e) => handleUpdatePayer(activeTicket, e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500 font-medium"
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
                  <label className="text-xs font-semibold text-slate-700">Household Split Rule</label>
                  <select
                    value={activeTicket.splitType}
                    onChange={(e) => handleUpdateSplitType(activeTicket, e.target.value as SplitType)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500 font-medium"
                  >
                    <option value="parents_only">Parents 50/50 Shared Pool</option>
                    <option value="equal_all">Equal All Family Members</option>
                    <option value="personal">100% Personal (No Split)</option>
                    <option value="custom">Custom Split</option>
                  </select>
                </div>
              </div>

              {/* Category Override */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Assigned Category</label>
                  <button
                    onClick={() => setIsEditingCategory(!isEditingCategory)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {isEditingCategory ? 'Done' : 'Change Category'}
                  </button>
                </div>
                {isEditingCategory ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleUpdateCategory(activeTicket, c.name)}
                        className={`p-2 text-xs rounded-lg text-left border transition-all ${
                          activeTicket.category === c.name
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-center justify-between">
                    <span>{activeTicket.category}</span>
                    <span className="text-[11px] text-slate-400">Target Envelope</span>
                  </div>
                )}
              </div>

              {/* Parsed Line Items Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900">
                    Parsed Receipt Line Items ({activeTicket.items.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Subtotal: {formatCurrency(activeTicket.items.reduce((acc, i) => acc + i.lineTotal, 0))}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
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
                            {item.isPersonal && (
                              <div className="text-[10px] text-amber-700 font-medium">
                                Flagged: Individual personal item
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
                            Sales Tax & Surcharges
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {formatCurrency(activeTicket.taxAmount)}
                          </td>
                        </tr>
                      )}
                      {activeTicket.tipAmount > 0 && (
                        <tr>
                          <td colSpan={3} className="py-1.5 px-3 text-slate-500 font-sans">
                            Gratuity / Tip
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {formatCurrency(activeTicket.tipAmount)}
                          </td>
                        </tr>
                      )}
                      <tr className="font-bold border-t border-slate-200 bg-slate-100/50">
                        <td colSpan={3} className="py-2 px-3 text-slate-900 font-sans">
                          Grand Total
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900 text-sm">
                          {formatCurrency(activeTicket.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                <button
                  onClick={() => onDeleteTicket(activeTicket.id)}
                  className="text-rose-600 hover:text-rose-700 font-medium py-1 px-2 hover:bg-rose-50 rounded transition-colors"
                >
                  Delete Ticket
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerifyTicket(activeTicket)}
                    className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Save Changes & Confirm
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              Select a ticket to inspect OCR items and splits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
