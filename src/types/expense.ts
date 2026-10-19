export interface FamilyMember {
  id: string;
  name: string;
  role: 'Parent' | 'Teen' | 'Child' | 'Partner';
  avatarUrl: string;
  color: string;
  monthlyTargetSpend?: number;
  email: string;
  phone?: string;
}

export interface TicketItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  suggestedCategory?: string;
  isPersonal?: boolean;
}

export type SplitType = 'equal_all' | 'parents_only' | 'custom' | 'personal';

export interface ExpenseTicket {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  merchant: string;
  category: string;
  amount: number;
  taxAmount: number;
  tipAmount: number;
  paidByMemberId: string;
  splitType: SplitType;
  splitWithMemberIds: string[];
  items: TicketItem[];
  aiConfidence: number; // 0 to 100
  aiNotes?: string;
  status: 'verified' | 'needs_review' | 'flagged' | 'settled';
  receiptImageUrl?: string;
  source: 'google_sheets' | 'manual_upload' | 'ai_ocr_pipeline' | 'mobile_camera';
  sheetRowIndex?: number;
  tags: string[];
  flags?: string[];
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  monthlyBudget: number;
  color: string;
  description: string;
}

export type SplitRuleMethod = 'equal_50_50' | 'proportional_income' | 'custom_fixed';

export interface HouseholdFinancialPlan {
  memberEarnings: Record<string, number>; // memberId -> monthly take-home income
  additionalIncome: number; // side income / freelance / family support
  splitMethod: SplitRuleMethod;
  customSplitRatios: Record<string, number>; // memberId -> custom percent (e.g. 60 / 40)
  savingsGoalName: string;
  targetSavingsMonthly: number;
}

export interface SettlementProposal {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  sharedContributionDelta: number;
  ratioExplanation?: string;
}

export interface SheetConfig {
  sheetIdOrUrl: string;
  sheetName: string;
  lastSyncedAt: string | null;
  autoSyncIntervalMinutes: number;
  isConfigured: boolean;
  columnMapping: {
    ticketId: string;
    date: string;
    merchant: string;
    category: string;
    amount: string;
    paidBy: string;
    itemsSummary: string;
    status: string;
    aiConfidence: string;
  };
}

export interface ProposedImprovement {
  id: string;
  category: 'pipeline' | 'accuracy' | 'finance' | 'family_ux';
  title: string;
  tagline: string;
  problemSolved: string;
  solutionMechanism: string;
  impactLevel: 'High' | 'Medium' | 'Essential';
  implementationStatus: 'ready' | 'recommended' | 'active';
  codeSnippet?: string;
  configurableOptionKey?: string;
}
