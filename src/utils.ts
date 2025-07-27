import type { Participant, Expense } from './types';
import { STORAGE_KEYS } from './types';

// localStorage utilities
export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    console.log(`Loading from localStorage (${key}):`, item);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return null;
  }
};

export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    console.log(`Saving to localStorage (${key}):`, data);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

export const clearStorage = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
};

// Data loading utilities
export const loadParticipants = (): Participant[] => {
  return loadFromStorage<Participant[]>(STORAGE_KEYS.PARTICIPANTS) || [];
};

export const loadExpenses = (): Expense[] => {
  return loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES) || [];
};

// Formatting utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validation utilities
export const validateParticipantName = (name: string, existingParticipants: Participant[]): string | null => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return 'Please enter a participant name';
  }

  const isDuplicate = existingParticipants.some(
    participant => participant.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (isDuplicate) {
    return 'A participant with this name already exists';
  }

  return null;
};

export const validateExpense = (expense: Partial<Expense>): string[] => {
  const errors: string[] = [];

  if (!expense.description?.trim()) {
    errors.push('Description is required');
  }

  if (!expense.amount || expense.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!expense.payer) {
    errors.push('Please select a payer');
  }

  if (!expense.involved || expense.involved.length === 0) {
    errors.push('At least one participant must be involved');
  }

  return errors;
};

// Calculation utilities
export const calculateParticipantStats = (participants: Participant[], expenses: Expense[]) => {
  const statsMap = new Map<string, { totalPaid: number; totalOwed: number }>();

  // Initialize stats
  participants.forEach(participant => {
    statsMap.set(participant.name, { totalPaid: 0, totalOwed: 0 });
  });

  // Process expenses
  expenses.forEach(expense => {
    const amount = expense.amount;
    const involvedCount = expense.involved.length;
    const sharePerPerson = amount / involvedCount;

    // Credit payer
    const payerStats = statsMap.get(expense.payer);
    if (payerStats) {
      payerStats.totalPaid += amount;
    }

    // Debit involved participants
    expense.involved.forEach(participantName => {
      const participantStats = statsMap.get(participantName);
      if (participantStats) {
        participantStats.totalOwed += sharePerPerson;
      }
    });
  });

  return statsMap;
};

export const roundToTwoDecimals = (amount: number): number => {
  return Math.round(amount * 100) / 100;
}; 