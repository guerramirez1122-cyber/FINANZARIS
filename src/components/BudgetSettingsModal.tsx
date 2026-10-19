import React, { useState } from 'react';
import { 
  ExpenseCategory, 
  FamilyMember, 
  HouseholdFinancialPlan, 
  SplitRuleMethod 
} from '../types/expense';
import { formatCurrency } from '../utils/calculations';
import { 
  X, 
  DollarSign, 
  Sliders, 
  PieChart, 
  TrendingUp, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2,
  Wallet
} from 'lucide-react';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onUpdateCategories: (categories: ExpenseCategory[]) => void;
  financialPlan: HouseholdFinancialPlan;
  onUpdateFinancialPlan: (plan: HouseholdFinancialPlan) => void;
  members: FamilyMember[];
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  financialPlan,
  onUpdateFinancialPlan,
  members,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'budget' | 'earnings' | 'splits'>('budget');

  // Local state for categories
  const [localCategories, setLocalCategories] = useState<ExpenseCategory[]>(categories);

  // Local state for earnings & plan
  const [memberEarnings, setMemberEarnings] = useState<Record<string, number>>(financialPlan.memberEarnings);
  const [additionalIncome, setAdditionalIncome] = useState<number>(financialPlan.additionalIncome);
  const [splitMethod, setSplitMethod] = useState<SplitRuleMethod>(financialPlan.splitMethod);
  const [customSplitRatios, setCustomSplitRatios] = useState<Record<string, number>>(financialPlan.customSplitRatios);
  const [savingsGoalName, setSavingsGoalName] = useState<string>(financialPlan.savingsGoalName);
  const [targetSavingsMonthly, setTargetSavingsMonthly] = useState<number>(financialPlan.targetSavingsMonthly);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');

  // Calculations
  const totalBudgeted = localCategories.reduce((acc, c) => acc + (Number(c.monthlyBudget) || 0), 0);
  const totalIncome = Object.values(memberEarnings).reduce((a, b) => a + (Number(b) || 0), 0) + (Number(additionalIncome) || 0);
  const projectedSurplus = totalIncome - totalBudgeted;
  const savingsRate = totalIncome > 0 ? (projectedSurplus / totalIncome) * 100 : 0;

  const handleCategoryBudgetChange = (id: string, newBudget: number) => {
    setLocalCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monthlyBudget: Math.max(0, newBudget) } : c))
    );
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const budget = parseFloat(newCatBudget) || 100;
    const newCat: ExpenseCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      monthlyBudget: budget,
      color: '#6366f1',
      description: 'Custom family spending envelope',
    };
    setLocalCategories([...localCategories, newCat]);
    setNewCatName('');
    setNewCatBudget('');
  };

  const handleRemoveCategory = (id: string) => {
    if (localCategories.length <= 1) return;
    setLocalCategories(localCategories.filter((c) => c.id !== id));
  };

  const handleEarningsChange = (memberId: string, val: number) => {
    setMemberEarnings((prev) => ({
      ...prev,
      [memberId]: Math.max(0, val),
    }));
  };

  const handleSaveAll = () => {
    onUpdateCategories(localCategories);
    onUpdateFinancialPlan({
      memberEarnings,
      additionalIncome,
      splitMethod,
      customSplitRatios,
      savingsGoalName,
      targetSavingsMonthly,
    });
    onClose();
  };

  // Parents income share calculation
  const p1 = members.find((m) => m.id === 'mem_elena');
  const p2 = members.find((m) => m.id === 'mem_carlos');
  const inc1 = Number(memberEarnings[p1?.id || '']) || 0;
  const inc2 = Number(memberEarnings[p2?.id || '']) || 0;
  const parentsTotalInc = inc1 + inc2;
  const p1Ratio = parentsTotalInc > 0 ? (inc1 / parentsTotalInc) * 100 : 50;
  const p2Ratio = parentsTotalInc > 0 ? (inc2 / parentsTotalInc) * 100 : 50;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto safe-area-pb">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Presupuesto, Ingresos y División
            </h2>
            <p className="text-xs text-slate-500">
              Límites mensuales por categoría, ingresos netos y reglas de reparto
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl min-h-[48px] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex-1 min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'budget'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Categorías ({localCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'earnings'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ingresos y Ahorro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('splits')}
            className={`flex-1 min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'splits'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reglas de División
          </button>
        </div>


        {/* Financial Flow KPI Summary Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-slate-500 text-[11px]">Total Monthly Income</div>
            <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {formatCurrency(totalIncome)}
            </div>
            <div className="text-[10px] text-slate-400">All earning members</div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px]">Total Budgeted Limits</div>
            <div className="text-base font-bold font-mono tabular-nums text-indigo-600 mt-0.5">
              {formatCurrency(totalBudgeted)}
            </div>
            <div className="text-[10px] text-slate-400">{localCategories.length} categories</div>
          </div>

          <div>
            <div className="text-slate-500 text-[11px]">Projected Savings Buffer</div>
            <div
              className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                projectedSurplus >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(projectedSurplus)}
            </div>
            <div className="text-[10px] text-slate-500">
              {savingsRate.toFixed(1)}% savings rate
            </div>
          </div>
        </div>

        {/* Tab 1: Category Budget Limits */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {localCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-sm">
                      {cat.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="25"
                      min="0"
                      value={cat.monthlyBudget}
                      onChange={(e) => handleCategoryBudgetChange(cat.id, Number(e.target.value))}
                      className="w-24 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-right text-slate-900 focus:outline-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Category Row */}
            <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-slate-800">Add Custom Category</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Pet Care & Vet"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                />
                <input
                  type="number"
                  placeholder="Budget ($)"
                  value={newCatBudget}
                  onChange={(e) => setNewCatBudget(e.target.value)}
                  className="w-24 text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Family Earnings & Income Input */}
        {activeTab === 'earnings' && (
          <div className="space-y-4 text-xs">
            <div className="text-slate-600">
              Input each family member&apos;s monthly take-home salary or allowance, plus any side income.
            </div>

            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {member.name} ({member.role})
                      </div>
                      <div className="text-[11px] text-slate-500">{member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={memberEarnings[member.id] || 0}
                      onChange={(e) => handleEarningsChange(member.id, Number(e.target.value))}
                      className="w-28 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg p-2 text-right text-slate-900 focus:outline-indigo-500"
                    />
                    <span className="text-slate-400 text-[11px]">/mo</span>
                  </div>
                </div>
              ))}

              {/* Additional Income Row */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs">
                    Additional Household Income
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Investments, rental property, or freelance support
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={additionalIncome}
                    onChange={(e) => setAdditionalIncome(Number(e.target.value))}
                    className="w-28 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg p-2 text-right text-slate-900 focus:outline-indigo-500"
                  />
                  <span className="text-slate-400 text-[11px]">/mo</span>
                </div>
              </div>
            </div>

            {/* Savings Goal Setting */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-3 pt-3">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Family Savings Vault &amp; Target</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Goal Title</label>
                  <input
                    type="text"
                    value={savingsGoalName}
                    onChange={(e) => setSavingsGoalName(e.target.value)}
                    className="w-full text-xs bg-white border border-indigo-200 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Monthly Savings Target ($)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={targetSavingsMonthly}
                    onChange={(e) => setTargetSavingsMonthly(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-indigo-200 rounded-lg p-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Family Split Rules */}
        {activeTab === 'splits' && (
          <div className="space-y-4 text-xs">
            <div className="text-slate-600">
              Select how shared household bills (Groceries, Utilities, Dinners) are split between partners:
            </div>

            <div className="space-y-3">
              {/* Option 1: 50 / 50 Equal Split */}
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  splitMethod === 'equal_50_50'
                    ? 'bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="splitMethod"
                  checked={splitMethod === 'equal_50_50'}
                  onChange={() => setSplitMethod('equal_50_50')}
                  className="mt-0.5 accent-indigo-600"
                />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">50 / 50 Equal Split</div>
                  <div className="text-slate-500 text-[11px]">
                    Shared expenses are divided equally down the middle, regardless of individual salary.
                  </div>
                </div>
              </label>

              {/* Option 2: Proportional to Earnings */}
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  splitMethod === 'proportional_income'
                    ? 'bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="splitMethod"
                  checked={splitMethod === 'proportional_income'}
                  onChange={() => setSplitMethod('proportional_income')}
                  className="mt-0.5 accent-indigo-600"
                />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Proportional to Earnings Ratio</span>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-semibold">
                      Recommended for fairness
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Based on entered salaries: <strong>{p1?.name}</strong> contributes{' '}
                    <span className="font-mono font-bold text-slate-800">{p1Ratio.toFixed(1)}%</span> and{' '}
                    <strong>{p2?.name}</strong> contributes{' '}
                    <span className="font-mono font-bold text-slate-800">{p2Ratio.toFixed(1)}%</span> of shared expenses.
                  </div>
                </div>
              </label>

              {/* Option 3: Custom Fixed Ratio */}
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  splitMethod === 'custom_fixed'
                    ? 'bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="splitMethod"
                  checked={splitMethod === 'custom_fixed'}
                  onChange={() => setSplitMethod('custom_fixed')}
                  className="mt-0.5 accent-indigo-600"
                />
                <div className="space-y-2 flex-1">
                  <div className="font-bold text-slate-900">Custom Fixed Ratio</div>
                  <div className="text-slate-500 text-[11px]">
                    Manually define partner percentage allocation (must sum to 100%).
                  </div>
                  {splitMethod === 'custom_fixed' && p1 && p2 && (
                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-semibold">{p1.name}:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={customSplitRatios[p1.id] || 50}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomSplitRatios({
                              [p1.id]: val,
                              [p2.id]: Math.max(0, 100 - val),
                            });
                          }}
                          className="w-16 font-mono p-1 bg-white border border-slate-200 rounded text-center"
                        />
                        <span>%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-semibold">{p2.name}:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {customSplitRatios[p2.id] || 50}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Total Presupuestado: <strong className="font-mono text-slate-900">{formatCurrency(totalBudgeted)}</strong>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial min-h-[48px] px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex-1 sm:flex-initial min-h-[48px] px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-all shadow-md active:scale-95 text-center"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
