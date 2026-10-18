import React from 'react';
import { 
  FamilyMember, 
  ExpenseCategory, 
  ExpenseTicket, 
  SettlementProposal,
  HouseholdFinancialPlan 
} from '../types/expense';
import { 
  formatCurrency, 
  calculateOverviewMetrics, 
  calculateCategorySpends, 
  calculateMemberContributions, 
  calculateSettlements,
  calculateIncomeMetrics 
} from '../utils/calculations';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Receipt, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  FileSpreadsheet,
  ShieldAlert,
  ArrowUpRight,
  Sliders,
  Wallet,
  PiggyBank,
  DollarSign,
  Users
} from 'lucide-react';

interface DashboardOverviewProps {
  tickets: ExpenseTicket[];
  categories: ExpenseCategory[];
  members: FamilyMember[];
  financialPlan: HouseholdFinancialPlan;
  onOpenBudgetSettings: () => void;
  onOpenSourcesModal?: () => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  onSelectTicket: (t: ExpenseTicket) => void;
  onNavigateTab: (tab: 'overview' | 'audit' | 'splits' | 'improvements' | 'sheets') => void;
  onSyncSheets: () => void;
  isSyncing: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tickets,
  categories,
  members,
  financialPlan,
  onOpenBudgetSettings,
  onOpenSourcesModal,
  selectedMonth,
  setSelectedMonth,
  onSelectTicket,
  onNavigateTab,
  onSyncSheets,
  isSyncing,
}) => {
  const metrics = calculateOverviewMetrics(tickets, categories, selectedMonth);
  const categorySpends = calculateCategorySpends(tickets, categories, selectedMonth);
  const memberContributions = calculateMemberContributions(tickets, members, selectedMonth);
  const settlements = calculateSettlements(tickets, members, selectedMonth, financialPlan);
  const incomeMetrics = calculateIncomeMetrics(financialPlan, metrics.totalBudget, metrics.totalSpent);

  const primarySettlement = settlements.length > 0 ? settlements[0] : null;
  const debtor = primarySettlement ? members.find((m) => m.id === primarySettlement.fromMemberId) : null;
  const creditor = primarySettlement ? members.find((m) => m.id === primarySettlement.toMemberId) : null;

  return (
    <div className="space-y-8">
      {/* Contextual Sub-Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Household Workspace</span>
            <span aria-hidden="true">·</span>
            <span>Monthly Budget &amp; Earnings Goals</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Family Expense Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sources & Members Settings Trigger */}
          {onOpenSourcesModal && (
            <button
              onClick={onOpenSourcesModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
              title="Connect Google Sheet/Form, WhatsApp, and rename family members"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Connect Sources &amp; Names</span>
            </button>
          )}

          {/* Budget & Earnings Settings Trigger */}
          <button
            onClick={onOpenBudgetSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Set Budget &amp; Earnings</span>
          </button>

          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 text-xs font-medium text-slate-700 shadow-xs">
            <button
              onClick={() => setSelectedMonth('2026-10')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedMonth === '2026-10'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              October 2026
            </button>
            <button
              onClick={() => setSelectedMonth('2026-09')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedMonth === '2026-09'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              September 2026
            </button>
          </div>

          {/* Sync status trigger */}
          <button
            onClick={onSyncSheets}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs shrink-0"
            title="Refresh latest ticket rows from Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Household Earnings & Cash Flow Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Household Income &amp; Savings Target</span>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 font-semibold px-2 py-0.5 rounded">
                  {financialPlan.splitMethod === 'proportional_income' ? 'Proportional Split' : '50/50 Split'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total monthly take-home: <strong className="font-mono text-slate-800">{formatCurrency(incomeMetrics.totalMonthlyIncome)}</strong> · Target Vault: <em>{financialPlan.savingsGoalName}</em>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">Monthly Take-Home</div>
              <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                {formatCurrency(incomeMetrics.totalMonthlyIncome)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <div className="text-slate-400 text-[11px]">Planned Budget</div>
              <div className="font-mono font-bold text-indigo-600 text-sm tabular-nums">
                {formatCurrency(metrics.totalBudget)}
              </div>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <div className="text-slate-400 text-[11px]">Projected Savings</div>
              <div className="font-mono font-bold text-emerald-600 text-sm tabular-nums">
                {formatCurrency(incomeMetrics.projectedSurplus)}
              </div>
            </div>

            <button
              onClick={onOpenBudgetSettings}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-auto lg:ml-0"
            >
              <span>Edit Earnings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Ticket Alert Banner (if tickets need review) */}
      {metrics.needsReviewCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                {metrics.needsReviewCount} {metrics.needsReviewCount === 1 ? 'ticket needs' : 'tickets need'} family audit
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">
                The Gemini Vision OCR extracted receipts with itemized ambiguity (e.g. mixed personal items or faint sales tax).
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('audit')}
            className="flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            <span>Review &amp; Verify</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Family Spend</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatCurrency(metrics.totalSpent)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="font-mono tabular-nums">{metrics.budgetUtilizationPercent.toFixed(1)}%</span>
            <span>of {formatCurrency(metrics.totalBudget)} monthly cap</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.budgetUtilizationPercent > 90 ? 'bg-rose-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, metrics.budgetUtilizationPercent)}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Safe Remaining Budget</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-2">
            {formatCurrency(metrics.remainingBudget)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Day {metrics.currentDay} of {metrics.daysInMonth}</span>
            <span aria-hidden="true">·</span>
            <span>{metrics.daysInMonth - metrics.currentDay} days left</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-mono">
            {formatCurrency(metrics.remainingBudget / Math.max(1, metrics.daysInMonth - metrics.currentDay))}/day allowance
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Daily Burn Rate</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatCurrency(metrics.dailyBurnRate)}
            <span className="text-xs font-normal text-slate-400"> /day</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Projected:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-700">
              {formatCurrency(metrics.projectedMonthEndTotal)}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-3 flex items-center gap-1 font-medium">
            <span>Under planned budget by {formatCurrency(Math.max(0, metrics.totalBudget - metrics.projectedMonthEndTotal))}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">AI Ingested Tickets</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {metrics.monthTickets.length}
            <span className="text-xs font-normal text-slate-400"> tickets</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-700 font-semibold">{metrics.verifiedCount} verified</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-semibold">{metrics.needsReviewCount} review</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sheet auto-synced row #152</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Category Budgets + Family Member Split Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Category Budget Envelope Matrix */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Category Spending Limits &amp; Progress</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time progress toward monthly budget goals
              </p>
            </div>
            <button
              onClick={onOpenBudgetSettings}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust Limits</span>
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {categorySpends.map(({ category, spent, percent, remaining, ticketCount, pacing }) => (
              <div key={category.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{category.name}</span>
                    <span className="text-slate-400 font-mono">({ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums text-slate-900 font-medium">
                      {formatCurrency(spent)}
                    </span>
                    <span className="text-slate-400 font-mono">/ {formatCurrency(category.monthlyBudget)}</span>
                    {pacing === 'over_budget' && (
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        Over
                      </span>
                    )}
                    {pacing === 'accelerated' && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Pacing Fast
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percent > 100
                        ? 'bg-rose-500'
                        : percent > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>{percent.toFixed(0)}% of limit</span>
                  <span className="font-mono tabular-nums">{formatCurrency(remaining)} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Family Member Contributions & Settlement */}
        <div className="lg:col-span-5 space-y-6">
          {/* Family Member Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Family Contributions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Who paid out of pocket this month</p>
              </div>
              <button
                onClick={() => onNavigateTab('splits')}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Splits Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {memberContributions.map(({ member, totalPaid, sharedPaid, personalPaid, percentageOfTotal, ticketCount }) => {
                const memberSalary = financialPlan.memberEarnings[member.id] || 0;

                return (
                  <div key={member.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900">{member.name}</span>
                            <span className="text-[10px] text-slate-500">({member.role})</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} paid
                            {memberSalary > 0 && ` · ${formatCurrency(memberSalary)} salary`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          {formatCurrency(totalPaid)}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-500">
                          {percentageOfTotal.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>

                    {/* Micro split indicator */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                      <span>Shared: {formatCurrency(sharedPaid)}</span>
                      <span>Personal: {formatCurrency(personalPaid)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Settle Balance Box */}
            {primarySettlement && debtor && creditor && (
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3.5 mt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Household Balance Settlement</span>
                  </div>
                  <span className="text-indigo-700 font-mono text-[11px]">
                    {primarySettlement.ratioExplanation || '50/50 Shared Pool'}
                  </span>
                </div>
                <p className="text-xs text-indigo-800 mt-1">
                  <strong>{debtor.name}</strong> pays <strong>{creditor.name}</strong>{' '}
                  <span className="font-bold font-mono tabular-nums">{formatCurrency(primarySettlement.amount)}</span> to balance shared expenses.
                </p>
                <button
                  onClick={() => onNavigateTab('splits')}
                  className="w-full mt-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors shadow-2xs"
                >
                  Review &amp; Settle Balance
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent AI Ingested Tickets Feed */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Captured Receipts</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live records parsed from your Google Sheet by Gemini Vision OCR
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('audit')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Audit Feed ({tickets.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="pb-3 pr-4">Ticket</th>
                <th className="pb-3 px-4">Merchant &amp; Items</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">Paid By</th>
                <th className="pb-3 px-4 text-center">AI Confidence</th>
                <th className="pb-3 px-4 text-right">Amount</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {metrics.monthTickets.slice(0, 6).map((ticket) => {
                const member = members.find((m) => m.id === ticket.paidByMemberId);
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 pr-4 font-mono text-slate-600 font-medium">
                      {ticket.id}
                      <div className="text-[11px] text-slate-400 font-sans">{ticket.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ticket.merchant}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {ticket.items.map((i) => i.description).join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700">{ticket.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {member?.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold">
                            {ticket.paidByMemberId.slice(0, 1)}
                          </div>
                        )}
                        <span className="text-slate-700 font-medium">{member?.name || ticket.paidByMemberId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-mono tabular-nums text-xs font-semibold ${
                          ticket.aiConfidence >= 90
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {ticket.aiConfidence}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(ticket.amount)}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(ticket);
                        }}
                        className="text-xs text-slate-500 hover:text-indigo-600 font-medium group-hover:underline flex items-center gap-1 justify-end ml-auto"
                      >
                        <span>Audit</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
