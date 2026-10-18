import React, { useState } from 'react';
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
  Trash2 
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

  // AI Scan Simulation preset options
  const handleSimulateScan = (preset: 'trader_joes' | 'home_depot' | 'bakery') => {
    if (preset === 'trader_joes') {
      setMerchant("Trader Joe's Supermarket");
      setAmount('64.20');
      setCategory('Groceries & Market');
      setTaxAmount('3.10');
      setAiConfidence(98);
      setItems([
        { id: 'tj-1', description: 'Organic Greek Yogurt 32oz', quantity: 2, unitPrice: 5.49, lineTotal: 10.98 },
        { id: 'tj-2', description: 'Frozen Vegetable Medley', quantity: 3, unitPrice: 3.29, lineTotal: 9.87 },
        { id: 'tj-3', description: 'Cold Brew Coffee Concentrate', quantity: 2, unitPrice: 8.99, lineTotal: 17.98 },
        { id: 'tj-4', description: 'Almond Butter & Spelt Bread', quantity: 1, unitPrice: 22.27, lineTotal: 22.27 },
      ]);
    } else if (preset === 'home_depot') {
      setMerchant('The Home Depot #0612');
      setAmount('134.80');
      setCategory('Home & Utilities');
      setTaxAmount('11.20');
      setAiConfidence(94);
      setItems([
        { id: 'hd-1', description: 'Lawn Fertilizer & Spreader Bag', quantity: 1, unitPrice: 42.50, lineTotal: 42.50 },
        { id: 'hd-2', description: 'LED Warm White Bulbs (Pack of 8)', quantity: 2, unitPrice: 19.99, lineTotal: 39.98 },
        { id: 'hd-3', description: 'Heavy Duty Garden Hose 50ft', quantity: 1, unitPrice: 41.12, lineTotal: 41.12 },
      ]);
    } else {
      setMerchant('Blue Daisy Bakery');
      setAmount('18.50');
      setCategory('Dining & Outings');
      setTaxAmount('1.25');
      setAiConfidence(84);
      setItems([
        { id: 'bk-1', description: 'Cappuccino & Scones', quantity: 2, unitPrice: 8.62, lineTotal: 17.25 },
      ]);
    }
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
      source: 'ai_ocr_pipeline',
      sheetRowIndex: 153,
      tags: ['Manual / Upload Ingest'],
      aiNotes: `Ingested via FamilyLedger OCR simulator with ${aiConfidence}% confidence rating.`,
    };

    onAddTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ingest Ticket / Receipt</h2>
            <p className="text-xs text-slate-500">
              Simulate AI OCR ticket parsing or enter paper ticket details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Fast Simulation Presets */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Fast AI Vision OCR Simulation Presets</span>
          </div>
          <p className="text-xs text-indigo-800">
            Click a preset to simulate camera receipt capture and automatic line-item parsing:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSimulateScan('trader_joes')}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs"
            >
              Trader Joe&apos;s ($64.20)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateScan('home_depot')}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs"
            >
              Home Depot ($134.80)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateScan('bakery')}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs"
            >
              Bakery Coffee ($18.50)
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Merchant Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Costco Wholesale"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Total Charged ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Split Rule</label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500"
              >
                <option value="parents_only">Parents 50/50 Shared</option>
                <option value="equal_all">Equal All Family</option>
                <option value="personal">100% Personal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Date on Receipt</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">AI Confidence Rating ({aiConfidence}%)</label>
              <input
                type="range"
                min="60"
                max="100"
                value={aiConfidence}
                onChange={(e) => setAiConfidence(Number(e.target.value))}
                className="w-full accent-indigo-600 mt-2"
              />
            </div>
          </div>

          {/* Line items preview */}
          {items.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-800">
                Extracted Line Items ({items.length})
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between font-mono"
                  >
                    <span className="font-sans text-slate-700 truncate max-w-[280px]">
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

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              Ingest & Append to Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
