import { ExpenseTicket, ExpenseCategory, HouseholdFinancialPlan } from '../types/expense';

export interface MonthlyPerformanceMetrics {
  currentMonth: string;
  previousMonth: string;
  totalIncome: number;
  totalSpentCurrent: number;
  totalSpentPrevious: number;
  netSavingsCurrent: number;
  netSavingsPrevious: number;
  savingsRateCurrent: number; // percentage (e.g. 62.5)
  savingsRatePrevious: number; // percentage
  savingsRateDelta: number; // e.g. +2.1%
  targetSavingsMonthly: number;
  targetSavingsRate: number; // percentage
  spendDeltaDollars: number;
  spendDeltaPercent: number;
}

export interface CategoryEfficiencyMetric {
  categoryId: string;
  categoryName: string;
  color: string;
  budget: number;
  currentSpend: number;
  previousSpend: number;
  deltaDollars: number;
  deltaPercent: number;
  efficiencyStatus: 'more_efficient' | 'stable' | 'less_efficient';
  ticketCountCurrent: number;
  ticketCountPrevious: number;
}

export interface YearlyMonthSummary {
  monthKey: string; // '2026-01', '2026-02', etc.
  monthName: string; // 'Ene', 'Feb', etc.
  income: number;
  spending: number;
  savings: number;
  savingsRate: number;
  isProjected?: boolean;
}

export interface YearlyAggregatedMetrics {
  year: number;
  monthsCount: number;
  ytdIncome: number;
  ytdSpending: number;
  ytdSavings: number;
  averageSavingsRate: number;
  monthlyBreakdown: YearlyMonthSummary[];
  categoryYearlyTotals: {
    categoryName: string;
    color: string;
    totalAmount: number;
    percentage: number;
  }[];
  peakSpendingMonth: {
    monthName: string;
    amount: number;
  };
  highestSavingsMonth: {
    monthName: string;
    amount: number;
  };
}

export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function calculateMonthlyPerformance(
  tickets: ExpenseTicket[],
  categories: ExpenseCategory[],
  financialPlan: HouseholdFinancialPlan,
  selectedMonth: string
): {
  metrics: MonthlyPerformanceMetrics;
  categoryEfficiencies: CategoryEfficiencyMetric[];
} {
  const previousMonth = getPreviousMonthKey(selectedMonth);

  // Total household monthly income
  const memberEarningsSum = Object.values(financialPlan.memberEarnings || {}).reduce((a, b) => a + b, 0);
  const totalIncome = memberEarningsSum + (financialPlan.additionalIncome || 0);

  // Tickets for current and previous month
  const currentTickets = tickets.filter((t) => t.date.startsWith(selectedMonth));
  const previousTickets = tickets.filter((t) => t.date.startsWith(previousMonth));

  const totalSpentCurrent = currentTickets.reduce((sum, t) => sum + t.amount, 0);
  const totalSpentPrevious = previousTickets.reduce((sum, t) => sum + t.amount, 0);

  const netSavingsCurrent = Math.max(0, totalIncome - totalSpentCurrent);
  const netSavingsPrevious = Math.max(0, totalIncome - totalSpentPrevious);

  const savingsRateCurrent = totalIncome > 0 ? (netSavingsCurrent / totalIncome) * 100 : 0;
  const savingsRatePrevious = totalIncome > 0 ? (netSavingsPrevious / totalIncome) * 100 : 0;
  const savingsRateDelta = savingsRateCurrent - savingsRatePrevious;

  const targetSavingsMonthly = financialPlan.targetSavingsMonthly || 3500;
  const targetSavingsRate = totalIncome > 0 ? (targetSavingsMonthly / totalIncome) * 100 : 40;

  const spendDeltaDollars = totalSpentCurrent - totalSpentPrevious;
  const spendDeltaPercent = totalSpentPrevious > 0 
    ? ((totalSpentCurrent - totalSpentPrevious) / totalSpentPrevious) * 100 
    : 0;

  const metrics: MonthlyPerformanceMetrics = {
    currentMonth: selectedMonth,
    previousMonth,
    totalIncome,
    totalSpentCurrent,
    totalSpentPrevious,
    netSavingsCurrent,
    netSavingsPrevious,
    savingsRateCurrent,
    savingsRatePrevious,
    savingsRateDelta,
    targetSavingsMonthly,
    targetSavingsRate,
    spendDeltaDollars,
    spendDeltaPercent,
  };

  // Category-level efficiency
  const categoryEfficiencies: CategoryEfficiencyMetric[] = categories.map((cat) => {
    const catCurrentTickets = currentTickets.filter((t) => t.category === cat.name);
    const catPrevTickets = previousTickets.filter((t) => t.category === cat.name);

    const currentSpend = catCurrentTickets.reduce((sum, t) => sum + t.amount, 0);
    const previousSpend = catPrevTickets.reduce((sum, t) => sum + t.amount, 0);

    const deltaDollars = currentSpend - previousSpend;
    const deltaPercent = previousSpend > 0 ? ((currentSpend - previousSpend) / previousSpend) * 100 : 0;

    let efficiencyStatus: 'more_efficient' | 'stable' | 'less_efficient' = 'stable';
    if (deltaPercent < -3) {
      efficiencyStatus = 'more_efficient'; // Lower spend than previous month
    } else if (deltaPercent > 3) {
      efficiencyStatus = 'less_efficient'; // Increased spend
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      budget: cat.monthlyBudget,
      currentSpend,
      previousSpend,
      deltaDollars,
      deltaPercent,
      efficiencyStatus,
      ticketCountCurrent: catCurrentTickets.length,
      ticketCountPrevious: catPrevTickets.length,
    };
  });

  return { metrics, categoryEfficiencies };
}

// Baseline monthly multipliers for 2026 historical aggregation
const HISTORICAL_MONTHS = [
  { key: '2026-01', name: 'Ene', spendRatio: 0.94 },
  { key: '2026-02', name: 'Feb', spendRatio: 0.88 },
  { key: '2026-03', name: 'Mar', spendRatio: 0.92 },
  { key: '2026-04', name: 'Abr', spendRatio: 0.96 },
  { key: '2026-05', name: 'May', spendRatio: 1.02 },
  { key: '2026-06', name: 'Jun', spendRatio: 1.08 },
  { key: '2026-07', name: 'Jul', spendRatio: 1.05 },
  { key: '2026-08', name: 'Ago', spendRatio: 0.98 },
  { key: '2026-09', name: 'Sep', spendRatio: 0.95 },
  { key: '2026-10', name: 'Oct', spendRatio: 0.92 },
  { key: '2026-11', name: 'Nov (Proy)', spendRatio: 1.04, isProjected: true },
  { key: '2026-12', name: 'Dic (Proy)', spendRatio: 1.15, isProjected: true },
];

export function calculateYearlyAggregated(
  tickets: ExpenseTicket[],
  categories: ExpenseCategory[],
  financialPlan: HouseholdFinancialPlan,
  year = 2026
): YearlyAggregatedMetrics {
  const memberEarningsSum = Object.values(financialPlan.memberEarnings || {}).reduce((a, b) => a + b, 0);
  const monthlyIncome = memberEarningsSum + (financialPlan.additionalIncome || 0);

  const baselineBudget = categories.reduce((sum, c) => sum + c.monthlyBudget, 0);

  const monthlyBreakdown: YearlyMonthSummary[] = HISTORICAL_MONTHS.map((m) => {
    // If we have actual tickets for this month, sum them; otherwise use calibrated seasonal baseline
    const monthTickets = tickets.filter((t) => t.date.startsWith(m.key));
    let spending = monthTickets.reduce((sum, t) => sum + t.amount, 0);

    if (spending === 0) {
      // Historical or projected estimate based on category budgets and seasonal ratio
      spending = Math.round(baselineBudget * m.spendRatio);
    }

    const savings = Math.max(0, monthlyIncome - spending);
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

    return {
      monthKey: m.key,
      monthName: m.name,
      income: monthlyIncome,
      spending,
      savings,
      savingsRate,
      isProjected: m.isProjected,
    };
  });

  // Calculate YTD totals (months 1 through 10: Ene - Oct)
  const ytdMonths = monthlyBreakdown.filter((m) => !m.isProjected);
  const ytdIncome = ytdMonths.reduce((sum, m) => sum + m.income, 0);
  const ytdSpending = ytdMonths.reduce((sum, m) => sum + m.spending, 0);
  const ytdSavings = ytdIncome - ytdSpending;
  const averageSavingsRate = ytdIncome > 0 ? (ytdSavings / ytdIncome) * 100 : 0;

  // Category yearly distribution
  const categoryTotals: Record<string, number> = {};
  categories.forEach((c) => {
    categoryTotals[c.name] = 0;
  });

  // Aggregate actual tickets for the year
  tickets.forEach((t) => {
    if (t.date.startsWith(String(year))) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  // Add proportional weighting for months without raw receipts to provide complete yearly picture
  const totalRawTickets = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const scaleFactor = totalRawTickets > 0 ? ytdSpending / totalRawTickets : 1;

  const categoryYearlyTotals = categories.map((cat) => {
    const raw = categoryTotals[cat.name] || 0;
    const scaled = Math.round(raw > 0 ? raw * scaleFactor : (cat.monthlyBudget * 10));
    return {
      categoryName: cat.name,
      color: cat.color,
      totalAmount: scaled,
      percentage: ytdSpending > 0 ? (scaled / ytdSpending) * 100 : 0,
    };
  });

  // Peak spending month & highest savings month
  let peakSpendingMonth = { monthName: ytdMonths[0].monthName, amount: ytdMonths[0].spending };
  let highestSavingsMonth = { monthName: ytdMonths[0].monthName, amount: ytdMonths[0].savings };

  ytdMonths.forEach((m) => {
    if (m.spending > peakSpendingMonth.amount) {
      peakSpendingMonth = { monthName: m.monthName, amount: m.spending };
    }
    if (m.savings > highestSavingsMonth.amount) {
      highestSavingsMonth = { monthName: m.monthName, amount: m.savings };
    }
  });

  return {
    year,
    monthsCount: ytdMonths.length,
    ytdIncome,
    ytdSpending,
    ytdSavings,
    averageSavingsRate,
    monthlyBreakdown,
    categoryYearlyTotals,
    peakSpendingMonth,
    highestSavingsMonth,
  };
}
