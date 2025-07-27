// Core data types
export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payer: string;
  involved: string[];
  date: string;
}

// Component prop types
export interface ParticipantsManagerProps {
  onParticipantsChange: (participants: Participant[]) => void;
}

export interface ExpenseFormProps {
  participants: Participant[];
  onExpenseAdded: (expense: Expense) => void;
}

export interface ExpenseListProps {
  onExpenseDeleted: (expenseId: string) => void;
}

// Calculation result types
export interface Balance {
  name: string;
  amount: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface ParticipantStats {
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

// localStorage keys
export const STORAGE_KEYS = {
  PARTICIPANTS: 'damfair_participants',
  EXPENSES: 'damfair_expenses'
} as const; 