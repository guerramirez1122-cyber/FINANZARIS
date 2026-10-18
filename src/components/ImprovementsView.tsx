import React, { useState } from 'react';
import { ProposedImprovement, ExpenseTicket } from '../types/expense';
import { formatCurrency, detectPotentialDuplicates } from '../utils/calculations';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Code2, 
  ShieldCheck, 
  Split, 
  TrendingUp, 
  Bell, 
  Layers, 
  Bot, 
  ArrowRight,
  ExternalLink,
  Sliders,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface ImprovementsViewProps {
  improvements: ProposedImprovement[];
  tickets: ExpenseTicket[];
}

export const ImprovementsView: React.FC<ImprovementsViewProps> = ({
  improvements,
  tickets,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [duplicateScanResults, setDuplicateScanResults] = useState<{
    ran: boolean;
    duplicates: { ticket1: ExpenseTicket; ticket2: ExpenseTicket; reason: string }[];
  }>({ ran: false, duplicates: [] });

  const [activeTabCategory, setActiveTabCategory] = useState<'all' | 'pipeline' | 'accuracy' | 'finance'>('all');

  const [pacingThreshold, setPacingThreshold] = useState<number>(75);
  const [enableDuplicateGuard, setEnableDuplicateGuard] = useState<boolean>(true);
  const [enableItemLevelSplits, setEnableItemLevelSplits] = useState<boolean>(true);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleRunDuplicateScan = () => {
    const dupes = detectPotentialDuplicates(tickets);
    setDuplicateScanResults({ ran: true, duplicates: dupes });
  };

  const filteredImprovements = improvements.filter(
    (imp) => activeTabCategory === 'all' || imp.category === activeTabCategory
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Architectural Advisory</span>
          <span aria-hidden="true">·</span>
          <span>Google Sheets & AI Pipeline Optimizations</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Proposed Pipeline & Experience Improvements
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Concrete enhancements tailored to your existing Google Sheets + AI ticket ingestion workflow.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTabCategory('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTabCategory === 'all'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Recommendations ({improvements.length})
        </button>
        <button
          onClick={() => setActiveTabCategory('pipeline')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTabCategory === 'pipeline'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ingestion & Pipeline
        </button>
        <button
          onClick={() => setActiveTabCategory('accuracy')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTabCategory === 'accuracy'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          AI OCR Accuracy
        </button>
        <button
          onClick={() => setActiveTabCategory('finance')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTabCategory === 'finance'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Financial Intelligence
        </button>
      </div>

      {/* Form vs WhatsApp Deep Comparison Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
              <Bot className="w-4 h-4" />
              <span>Architecture Decision: Google Forms vs WhatsApp Ingestion</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Why WhatsApp is 10x More Effective for Family Receipt Capture
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              You already built an automation with a Google Form writing to Google Sheets. That is a great database foundation! However, here is why adding a WhatsApp gateway turns family compliance from 40% to 95%:
            </p>
          </div>
        </div>

        {/* Side by Side Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Google Form (Your Current Setup)</span>
              <span className="text-[10px] text-slate-500 font-mono">Good Foundation</span>
            </div>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Structured questions (categories, member dropdowns, amounts).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Direct, native write to your existing Google Sheet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">✕</span>
                <span><strong>High checkout friction:</strong> Spouses carrying groceries rarely open a bookmark, wait for the form to load, and manually type item details.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">✕</span>
                <span>Receipt photo upload in Forms requires Google account storage permissions.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>WhatsApp / Telegram Bot (Recommended Upgrade)</span>
              <span className="text-[10px] text-emerald-700 font-semibold font-mono">Zero Friction</span>
            </div>
            <ul className="space-y-1.5 text-emerald-900">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Zero friction:</strong> Take photo inside WhatsApp or text &quot;Costco 85&quot; in the family group.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Gemini Vision Auto-OCR:</strong> The bot extracts merchant, total, line items, and taxes automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Instant reply:</strong> Bot replies: &quot;Saved $85.40 at Costco! Marked Pending Verification.&quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Writes to the exact same Google Sheet!</strong> Your existing database remains untouched.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* The Recommended Hybrid Blueprint */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
          <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recommended Hybrid Flow: Google Form + WhatsApp + FamilyLedger Dashboard</span>
          </div>
          <p className="text-xs text-indigo-800 leading-relaxed">
            Keep your Google Sheet as the single database! Both your Google Form (for planned desktop entry) and the WhatsApp bot (for quick phone snaps) append rows to this sheet. Then you open <strong>FamilyLedger</strong> to review the feed and click <strong>Approve &amp; Verify</strong> with full financial clarity!
          </p>
        </div>
      </div>

      {/* Interactive Improvement 1: Ingestion Automation & Apps Script Blueprint */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
              <Code2 className="w-4 h-4" />
              <span>Implementation Blueprint: Google Apps Script Webhook</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Deploy WhatsApp / Photo Webhook to Your Google Sheet
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Copy this script into your Google Sheet to receive WhatsApp or Telegram photo posts and parse line items into your database rows.
            </p>
          </div>

          <button
            onClick={() => handleCopyCode('apps_script', improvements[0].codeSnippet || '')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
          >
            {copiedCodeId === 'apps_script' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Apps Script</span>
              </>
            )}
          </button>
        </div>

        {/* Code Snippet Box */}
        {improvements[0].codeSnippet && (
          <div className="mt-3 bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-56">
            <pre>{improvements[0].codeSnippet}</pre>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="font-semibold text-slate-800">1. Extensions &gt; Apps Script</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Open your Google Sheet and paste this into Code.gs
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="font-semibold text-slate-800">2. Deploy as Web App</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Execute as &quot;Me&quot; with access granted to &quot;Anyone&quot;
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="font-semibold text-slate-800">3. Connect Phone Shortcut</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Family members snap photo and click &quot;Post Receipt&quot;
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Improvement 2: AI Duplicate & Ghost Charge Guardian */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
              <ShieldCheck className="w-4 h-4" />
              <span>Improvement 2: Data Quality & Anti-Duplication</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              AI Duplicate Ticket & Ghost Charge Detection
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              <strong>The Problem:</strong> When two family members shop together (or when a paper receipt is snapped after paying via credit card sync), receipts get uploaded twice, creating inflated budget reports.
            </p>
            <p className="text-xs text-slate-600 max-w-2xl">
              <strong>The Solution:</strong> Real-time heuristic check comparing date, merchant fuzzy match, and total cents. If detected, prompts 1-click merge or discard before appending to Google Sheet.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <button
              onClick={handleRunDuplicateScan}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
            >
              Run Live Duplicate Scan
            </button>
          </div>
        </div>

        {/* Scan Status Result */}
        {duplicateScanResults.ran && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                Scan Completed across {tickets.length} tickets in database
              </span>
            </div>
            {duplicateScanResults.duplicates.length === 0 ? (
              <p className="text-slate-600">
                Clean ledger! No duplicate receipts found with matching merchant, date, and amount.
              </p>
            ) : (
              <div className="space-y-2">
                {duplicateScanResults.duplicates.map((d, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                    <span className="font-semibold">{d.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Improvement 3: Multi-Category Basket Splitting for Big-Box Stores */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
            <Split className="w-4 h-4" />
            <span>Improvement 3: Item-Level Budget Granularity</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Multi-Category Basket Splitting for Big Box Stores (Target, Costco, Walmart)
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            <strong>The Problem:</strong> A single $250 Costco ticket usually contains $160 in food, $50 in home cleaning supplies, and $40 in clothing. Lumping the entire ticket under &quot;Groceries&quot; makes grocery budgets appear blown while hiding true household supply costs.
          </p>
          <p className="text-xs text-slate-600 max-w-2xl">
            <strong>The Solution:</strong> Leverage Gemini item descriptions to automatically split line-items into virtual sub-tickets so your category envelopes reflect reality.
          </p>
        </div>

        {/* Live Example Demonstration */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>Example: Target Superstore Receipt ($87.65)</span>
            <span className="font-mono text-indigo-600">Auto-Split Preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500 text-[11px]">Sub-Basket 1</div>
              <div className="font-bold text-slate-900 mt-0.5">Kids & Education</div>
              <div className="font-mono tabular-nums text-slate-700 font-semibold mt-1">$60.90</div>
              <div className="text-[11px] text-slate-400 mt-1">AP Bio Prep, Pens</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500 text-[11px]">Sub-Basket 2</div>
              <div className="font-bold text-slate-900 mt-0.5">Personal Care</div>
              <div className="font-mono tabular-nums text-slate-700 font-semibold mt-1">$20.00</div>
              <div className="text-[11px] text-slate-400 mt-1">Shower Gel (Carlos)</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-slate-500 text-[11px]">Taxes & Fees</div>
              <div className="font-bold text-slate-900 mt-0.5">Sales Tax (Proportional)</div>
              <div className="font-mono tabular-nums text-slate-700 font-semibold mt-1">$6.75</div>
              <div className="text-[11px] text-slate-400 mt-1">State & Local</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Improvement 4: Envelope Pacing Guardrails */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span>Improvement 4: Proactive Pacing Guardrails</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Mid-Month Spending Velocity Warnings
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl">
            <strong>The Problem:</strong> Reviewing spreadsheets at month-end is reactive; you only find out after money is already spent.
          </p>
          <p className="text-xs text-slate-600 max-w-2xl">
            <strong>The Solution:</strong> Pacing alerts calculate current day vs total monthly days. If Dining or Groceries reaches {pacingThreshold}% before Day 18, FamilyLedger flags it for a gentle family nudge.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-800">
              Alert Trigger Threshold: <span className="font-mono text-indigo-600">{pacingThreshold}%</span> of budget
            </label>
            <span className="text-slate-500 text-[11px]">Triggers before day 18 of the month</span>
          </div>
          <input
            type="range"
            min="50"
            max="90"
            step="5"
            value={pacingThreshold}
            onChange={(e) => setPacingThreshold(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
};
