import React, { useState } from 'react';
import { 
  FamilyMember, 
  ExpenseTicket, 
  SettlementProposal,
  HouseholdFinancialPlan 
} from '../types/expense';
import { formatCurrency, calculateMemberContributions, calculateSettlements } from '../utils/calculations';
import { 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Receipt, 
  Sparkles, 
  CreditCard, 
  DollarSign, 
  Wallet,
  Calendar,
  History,
  Sliders
} from 'lucide-react';

interface FamilySplitsViewProps {
  tickets: ExpenseTicket[];
  members: FamilyMember[];
  selectedMonth: string;
  financialPlan: HouseholdFinancialPlan;
  onOpenBudgetSettings: () => void;
}

export const FamilySplitsView: React.FC<FamilySplitsViewProps> = ({
  tickets,
  members,
  selectedMonth,
  financialPlan,
  onOpenBudgetSettings,
}) => {
  const memberContributions = calculateMemberContributions(tickets, members, selectedMonth);
  const settlements = calculateSettlements(tickets, members, selectedMonth, financialPlan);

  // Settlement history state
  const [settledHistory, setSettledHistory] = useState<
    { id: string; date: string; from: string; to: string; amount: number; method: string }[]
  >([
    {
      id: 'stl-prev-1',
      date: '2026-09-30',
      from: 'Carlos',
      to: 'Elena',
      amount: 142.50,
      method: 'Zelle transfer #9812',
    },
  ]);

  const [settlementSuccess, setSettlementSuccess] = useState<string | null>(null);

  const handleRecordSettlement = (proposal: SettlementProposal) => {
    const fromMember = members.find((m) => m.id === proposal.fromMemberId)?.name || 'Member';
    const toMember = members.find((m) => m.id === proposal.toMemberId)?.name || 'Member';

    const newRecord = {
      id: 'stl-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      from: fromMember,
      to: toMember,
      amount: proposal.amount,
      method: 'Marked Settled via FamilyLedger',
    };

    setSettledHistory([newRecord, ...settledHistory]);
    setSettlementSuccess(`Recorded settlement of ${formatCurrency(proposal.amount)} from ${fromMember} to ${toMember}!`);
    setTimeout(() => setSettlementSuccess(null), 4000);
  };

  // Teen specific breakdown
  const teen = members.find((m) => m.role === 'Teen');
  const teenSpend = memberContributions.find((c) => c.member.id === teen?.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Household Fairness Engine</span>
            <span aria-hidden="true">·</span>
            <span>Shared Pool & Individual Accounting</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Family Member Splits & Net Settlements
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Equalizes shared household spending based on your {financialPlan.splitMethod.replace(/_/g, ' ')} rule.
          </p>
        </div>

        <button
          onClick={onOpenBudgetSettings}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <span>Edit Split Ratios &amp; Earnings</span>
        </button>
      </div>

      {/* Success Notification */}
      {settlementSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{settlementSuccess}</span>
        </div>
      )}

      {/* Primary Settlement Action Banner */}
      {settlements.length > 0 ? (
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span>Recommended Balance Settlement for {selectedMonth}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl font-extrabold font-mono tabular-nums text-white">
                  {formatCurrency(settlements[0].amount)}
                </h2>
                <span className="text-sm text-slate-300">
                  net transfer to equalize shared family pool
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Calculated by auditing all shared household tickets (Costco, PG&E, Trader Joe&apos;s) against personal purchases.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => handleRecordSettlement(settlements[0])}
                className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs whitespace-nowrap"
              >
                Record Settlement as Settled
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-1">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
          <h2 className="text-sm font-bold text-emerald-900">Household Shared Expenses Perfectly Balanced</h2>
          <p className="text-xs text-emerald-700">
            Both parents have contributed equally to shared family costs this month.
          </p>
        </div>
      )}

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {memberContributions.map(({ member, totalPaid, sharedPaid, personalPaid, percentageOfTotal, ticketCount }) => (
          <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={member.avatarUrl}
                alt={member.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{member.role}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ticketCount} tickets</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Out-of-Pocket</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {formatCurrency(totalPaid)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Shared Household Pool</span>
                <span className="font-mono tabular-nums text-slate-700 font-medium">
                  {formatCurrency(sharedPaid)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Personal Discretionary</span>
                <span className="font-mono tabular-nums text-slate-700 font-medium">
                  {formatCurrency(personalPaid)}
                </span>
              </div>

              {member.monthlyTargetSpend && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Target Cap: {formatCurrency(member.monthlyTargetSpend)}</span>
                    <span className="font-mono">{((totalPaid / member.monthlyTargetSpend) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-800 h-full rounded-full"
                      style={{ width: `${Math.min(100, (totalPaid / member.monthlyTargetSpend) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Teen Allowance & Student Tracking (Sofia) */}
      {teen && teenSpend && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Teen Allowance & Education Ledger ({teen.name})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Separates parent-funded educational costs (sports, books) from student discretionary spending
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Discretionary Remaining: </span>
              <span className="text-xs font-bold font-mono text-emerald-600">
                {formatCurrency(Math.max(0, (teen.monthlyTargetSpend || 400) - teenSpend.personalPaid))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-xs text-slate-500">Parent-Covered (School & Sports)</div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(
                  tickets
                    .filter((t) => t.category === 'Kids & Education')
                    .reduce((acc, t) => acc + t.amount, 0)
                )}
              </div>
              <div className="text-[11px] text-slate-500">Soccer dues, AP Biology textbooks, supplies</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-xs text-slate-500">Sofia&apos;s Personal Spending</div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(teenSpend.personalPaid)}
              </div>
              <div className="text-[11px] text-slate-500">Blue Bottle Cafe, personal toiletries</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
              <div className="text-xs text-slate-500">Allowance Limit</div>
              <div className="text-lg font-bold font-mono text-slate-900">
                {formatCurrency(teen.monthlyTargetSpend || 400)}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">On track for month end</div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Settlements Log */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-bold text-slate-900">Settlement Ledger & Proofs</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {settledHistory.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-800">
                  {item.from} paid {item.to}
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  {item.date} · {item.method}
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                {formatCurrency(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
