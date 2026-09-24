export type CostType = 'fixed' | 'variable' | 'investment';

export interface InvestmentCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  created_at?: string;
}

export interface SectorBudget {
  id?: number;
  sector: string;
  category_type: CostType;
  allocated_amount: number;
  spent_amount?: number;
  manual_spent?: number | null;
  is_manual?: boolean;
  month: string;
  notes?: string;
}

export interface FinancialAccount {
  id: number;
  name: string;
  type: 'operational' | 'working_capital' | 'emergency_reserve' | 'investment_fund';
  balance: number;
  target_amount: number;
  description: string;
  updated_at?: string;
}

export interface RecurringCost {
  id: number;
  description: string;
  amount: number;
  category_type: CostType;
  department: string;
  due_day: number;
  payment_method: string;
  is_active: number;
}

export interface CashFlowHealth {
  avg_monthly_burn: number;
  total_cash: number;
  working_capital: number;
  emergency_reserve: number;
  ideal_working_capital: number;
  ideal_emergency_reserve: number;
  current_runway_months: string;
  recommendation: string;
}
