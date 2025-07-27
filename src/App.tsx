import { useState, useEffect, useRef } from 'react';
import type { Participant, Expense } from './types';
import { STORAGE_KEYS } from './types';
import { loadParticipants, loadExpenses, clearStorage, saveToStorage } from './utils';
import ParticipantsManager from './components/ParticipantsManager';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import DebtCalculator from './components/DebtCalculator';

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitialLoad = useRef(true);

  // Load data from localStorage on first render
  useEffect(() => {
    // Test localStorage
    try {
      localStorage.setItem('test', 'working');
      const testValue = localStorage.getItem('test');
      console.log('localStorage test:', testValue);
      localStorage.removeItem('test');
    } catch (error) {
      console.error('localStorage is not available:', error);
    }

    const loadedParticipants = loadParticipants();
    const loadedExpenses = loadExpenses();
    
    console.log('Loading from localStorage:', {
      participants: loadedParticipants,
      expenses: loadedExpenses
    });
    
    setParticipants(loadedParticipants);
    setExpenses(loadedExpenses);
    setIsInitialized(true);
    isInitialLoad.current = false;
  }, []);

  // Save participants to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && !isInitialLoad.current) {
      console.log('Saving participants to localStorage:', participants);
      saveToStorage(STORAGE_KEYS.PARTICIPANTS, participants);
    }
  }, [participants, isInitialized]);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (isInitialized && !isInitialLoad.current) {
      console.log('Saving expenses to localStorage:', expenses);
      saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
    }
  }, [expenses, isInitialized]);

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all participants and expenses.')) {
      // Clear localStorage
      clearStorage();
      
      // Clear state
      setParticipants([]);
      setExpenses([]);
      
      // Force a page refresh to ensure all components are reset
      window.location.reload();
    }
  };

  const handleParticipantsChange = (newParticipants: Participant[]) => {
    setParticipants(newParticipants);
  };

  const handleExpenseAdded = (newExpense: Expense) => {
    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
  };

  const handleExpenseDeleted = (expenseId: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading DamFair...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🦫</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DamFair</h1>
                <p className="text-sm text-gray-600">Fair expense splitting, no drama</p>
              </div>
            </div>
            <button
              onClick={handleResetAll}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <ParticipantsManager 
                participants={participants} 
                onParticipantsChange={handleParticipantsChange} 
              />
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <ExpenseForm 
                participants={participants} 
                onExpenseAdded={handleExpenseAdded} 
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <ExpenseList expenses={expenses} onExpenseDeleted={handleExpenseDeleted} />
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <DebtCalculator 
                participants={participants} 
                expenses={expenses} 
              />
            </div>
            

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-sm">
              Made with ❤️ for fair expense splitting
            </p>
            <p className="text-gray-400 text-xs flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Works offline. Your data is saved in this browser.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
