import { 
  ExpenseTicket, 
  FamilyMember, 
  ExpenseCategory, 
  SettlementProposal,
  HouseholdFinancialPlan 
} from '../types/expense';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const calculateOverviewMetrics = (
  tickets: ExpenseTicket[],
  categories: ExpenseCategory[],
  selectedMonthYear: string // 'YYYY-MM'
) => {
  // Filter tickets for the target month
  const monthTickets = tickets.filter((t) => t.date.startsWith(selectedMonthYear));
  
  const totalSpent = monthTickets.reduce((acc, t) => acc + t.amount, 0);
  const totalBudget = categories.reduce((acc, c) => acc + c.monthlyBudget, 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const budgetUtilizationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Day of month calculations for pacing
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthElapsedRatio = currentDay / daysInMonth;
  const expectedBurnByToday = totalBudget * monthElapsedRatio;
  const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;
  const projectedMonthEndTotal = dailyBurnRate * daysInMonth;

  // Pending AI tickets
  const needsReviewCount = monthTickets.filter((t) => t.status === 'needs_review' || t.status === 'flagged').length;
  const verifiedCount = monthTickets.filter((t) => t.status === 'verified').length;

  return {
    monthTickets,
    totalSpent,
    totalBudget,
    remainingBudget,
    budgetUtilizationPercent,
    currentDay,
    daysInMonth,
    dailyBurnRate,
    projectedMonthEndTotal,
    expectedBurnByToday,
    needsReviewCount,
    verifiedCount,
  };
};

export const calculateCategorySpends = (
  tickets: ExpenseTicket[],
  categories: ExpenseCategory[],
  selectedMonthYear: string
) => {
  const monthTickets = tickets.filter((t) => t.date.startsWith(selectedMonthYear));

  return categories.map((cat) => {
    const catTickets = monthTickets.filter((t) => t.category === cat.name);
    const spent = catTickets.reduce((acc, t) => acc + t.amount, 0);
    const percent = cat.monthlyBudget > 0 ? (spent / cat.monthlyBudget) * 100 : 0;
    const remaining = Math.max(0, cat.monthlyBudget - spent);
    const ticketCount = catTickets.length;

    // Pacing status: on track, accelerated, or over budget
    let pacing: 'on_track' | 'accelerated' | 'over_budget' = 'on_track';
    if (spent > cat.monthlyBudget) {
      pacing = 'over_budget';
    } else if (percent > 70 && new Date().getDate() < 20) {
      pacing = 'accelerated';
    }

    return {
      category: cat,
      spent,
      percent,
      remaining,
      ticketCount,
      pacing,
    };
  });
};

export const calculateMemberContributions = (
  tickets: ExpenseTicket[],
  members: FamilyMember[],
  selectedMonthYear: string
) => {
  const monthTickets = tickets.filter((t) => t.date.startsWith(selectedMonthYear));
  const totalSpent = monthTickets.reduce((acc, t) => acc + t.amount, 0);

  return members.map((member) => {
    const memberPaidTickets = monthTickets.filter((t) => t.paidByMemberId === member.id);
    const totalPaid = memberPaidTickets.reduce((acc, t) => acc + t.amount, 0);
    const percentageOfTotal = totalSpent > 0 ? (totalPaid / totalSpent) * 100 : 0;
    const ticketCount = memberPaidTickets.length;

    // Shared vs Personal breakdown
    const sharedPaid = memberPaidTickets
      .filter((t) => t.splitType !== 'personal')
      .reduce((acc, t) => acc + t.amount, 0);
    const personalPaid = memberPaidTickets
      .filter((t) => t.splitType === 'personal')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      member,
      totalPaid,
      sharedPaid,
      personalPaid,
      percentageOfTotal,
      ticketCount,
    };
  });
};

export const calculateIncomeMetrics = (
  plan: HouseholdFinancialPlan,
  totalBudget: number,
  totalSpent: number
) => {
  const memberTotal = Object.values(plan.memberEarnings).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalMonthlyIncome = memberTotal + (Number(plan.additionalIncome) || 0);
  const projectedSurplus = Math.max(0, totalMonthlyIncome - totalBudget);
  const actualSurplusToDate = Math.max(0, totalMonthlyIncome - totalSpent);
  const savingsRatePercent = totalMonthlyIncome > 0 ? (projectedSurplus / totalMonthlyIncome) * 100 : 0;
  const goalProgressPercent = plan.targetSavingsMonthly > 0 ? (actualSurplusToDate / plan.targetSavingsMonthly) * 100 : 0;

  return {
    totalMonthlyIncome,
    projectedSurplus,
    actualSurplusToDate,
    savingsRatePercent,
    goalProgressPercent,
  };
};

export const calculateSettlements = (
  tickets: ExpenseTicket[],
  members: FamilyMember[],
  selectedMonthYear: string,
  plan?: HouseholdFinancialPlan
): SettlementProposal[] => {
  const monthTickets = tickets.filter((t) => t.date.startsWith(selectedMonthYear));
  
  // Calculate net balances for shared family expenses among parents/partners
  const parent1 = members.find((m) => m.id === 'mem_elena');
  const parent2 = members.find((m) => m.id === 'mem_carlos');

  if (!parent1 || !parent2) return [];

  let p1SharedPaid = 0;
  let p2SharedPaid = 0;

  monthTickets.forEach((t) => {
    if (t.splitType === 'parents_only' || t.splitType === 'equal_all') {
      if (t.paidByMemberId === parent1.id) {
        p1SharedPaid += t.amount;
      } else if (t.paidByMemberId === parent2.id) {
        p2SharedPaid += t.amount;
      }
    }
  });

  const totalShared = p1SharedPaid + p2SharedPaid;

  // Determine split targets based on financial plan
  let ratio1 = 0.5;
  let ratio2 = 0.5;
  let ratioExplanation = '50 / 50 Equal household split';

  if (plan) {
    if (plan.splitMethod === 'proportional_income') {
      const inc1 = Number(plan.memberEarnings[parent1.id]) || 0;
      const inc2 = Number(plan.memberEarnings[parent2.id]) || 0;
      const combinedInc = inc1 + inc2;
      if (combinedInc > 0) {
        ratio1 = inc1 / combinedInc;
        ratio2 = inc2 / combinedInc;
        ratioExplanation = `Proportional to take-home earnings (${(ratio1 * 100).toFixed(1)}% / ${(ratio2 * 100).toFixed(1)}%)`;
      }
    } else if (plan.splitMethod === 'custom_fixed') {
      const p1Custom = Number(plan.customSplitRatios[parent1.id]) || 50;
      const p2Custom = Number(plan.customSplitRatios[parent2.id]) || 50;
      const sum = p1Custom + p2Custom;
      if (sum > 0) {
        ratio1 = p1Custom / sum;
        ratio2 = p2Custom / sum;
        ratioExplanation = `Custom fixed household ratio (${(ratio1 * 100).toFixed(0)}% / ${(ratio2 * 100).toFixed(0)}%)`;
      }
    }
  }

  const targetP1 = totalShared * ratio1;
  const targetP2 = totalShared * ratio2;
  const p1Delta = p1SharedPaid - targetP1; // positive if paid more than target, negative if paid less

  const proposals: SettlementProposal[] = [];

  if (Math.abs(p1Delta) > 0.5) {
    if (p1Delta > 0) {
      // Carlos owes Elena
      proposals.push({
        fromMemberId: parent2.id,
        toMemberId: parent1.id,
        amount: Math.abs(p1Delta),
        sharedContributionDelta: p1Delta,
        ratioExplanation,
      });
    } else {
      // Elena owes Carlos
      proposals.push({
        fromMemberId: parent1.id,
        toMemberId: parent2.id,
        amount: Math.abs(p1Delta),
        sharedContributionDelta: p1Delta,
        ratioExplanation,
      });
    }
  }

  return proposals;
};

export const detectPotentialDuplicates = (tickets: ExpenseTicket[]): { ticket1: ExpenseTicket; ticket2: ExpenseTicket; reason: string }[] => {
  const duplicates: { ticket1: ExpenseTicket; ticket2: ExpenseTicket; reason: string }[] = [];

  for (let i = 0; i < tickets.length; i++) {
    for (let j = i + 1; j < tickets.length; j++) {
      const a = tickets[i];
      const b = tickets[j];

      const sameMerchant = a.merchant.toLowerCase().trim() === b.merchant.toLowerCase().trim();
      const sameAmount = Math.abs(a.amount - b.amount) < 0.05;
      const sameDate = a.date === b.date;

      if (sameMerchant && sameAmount && sameDate) {
        duplicates.push({
          ticket1: a,
          ticket2: b,
          reason: `Exact match on merchant (${a.merchant}), amount (${formatCurrency(a.amount)}), and date (${a.date})`,
        });
      }
    }
  }

  return duplicates;
};
