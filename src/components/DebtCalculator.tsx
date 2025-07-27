import { useState, useEffect } from 'react';
import type { Participant, Expense, Balance, Settlement, ParticipantStats } from '../types';
import { formatCurrency, roundToTwoDecimals, calculateParticipantStats } from '../utils';

interface DebtCalculatorProps {
  participants: Participant[];
  expenses: Expense[];
}

export default function DebtCalculator({ participants, expenses }: DebtCalculatorProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<ParticipantStats[]>([]);
  const [showSpendingDetails, setShowSpendingDetails] = useState(false);

  const calculateSettlements = (balanceArray: Balance[]) => {
    const settlements: Settlement[] = [];
    const balances = balanceArray.map(balance => ({ ...balance }));

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = balances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount);
    const debtors = balances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      if (Math.abs(creditor.amount) < 0.01 || Math.abs(debtor.amount) < 0.01) {
        // Skip if balance is effectively zero
        if (Math.abs(creditor.amount) < 0.01) creditorIndex++;
        if (Math.abs(debtor.amount) < 0.01) debtorIndex++;
        continue;
      }

      const settlementAmount = Math.min(creditor.amount, Math.abs(debtor.amount));
      
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: roundToTwoDecimals(settlementAmount)
      });

      // Update remaining balances
      creditor.amount = roundToTwoDecimals(creditor.amount - settlementAmount);
      debtor.amount = roundToTwoDecimals(debtor.amount + settlementAmount);

      // Move to next person if balance is settled
      if (Math.abs(creditor.amount) < 0.01) creditorIndex++;
      if (Math.abs(debtor.amount) < 0.01) debtorIndex++;
    }

    setSettlements(settlements);
  };

  // Calculate balances and settlements when data changes
  useEffect(() => {
    if (participants.length > 0 && expenses.length > 0) {
      // Use the same calculation logic as SpendingChart
      const statsMap = calculateParticipantStats(participants, expenses);

      // Convert to balance array (net balance = totalPaid - totalOwed)
      const balanceArray: Balance[] = Array.from(statsMap.entries()).map(([name, stats]: [string, { totalPaid: number; totalOwed: number }]) => ({
        name,
        amount: roundToTwoDecimals(stats.totalPaid - stats.totalOwed)
      }));
      
      // Also calculate detailed stats for spending overview
      const statsArray: ParticipantStats[] = Array.from(statsMap.entries()).map(([name, stats]) => ({
        name,
        totalPaid: roundToTwoDecimals(stats.totalPaid),
        totalOwed: roundToTwoDecimals(stats.totalOwed),
        netBalance: roundToTwoDecimals(stats.totalPaid - stats.totalOwed)
      }));
      
      setBalances(balanceArray);
      setStats(statsArray);
      calculateSettlements(balanceArray);
    } else {
      setBalances([]);
      setStats([]);
      setSettlements([]);
    }
  }, [participants, expenses]);

  const getMaxAmount = (): number => {
    if (stats.length === 0) return 100;
    const maxPaid = Math.max(...stats.map(s => s.totalPaid));
    const maxOwed = Math.max(...stats.map(s => s.totalOwed));
    return Math.max(maxPaid, maxOwed, 100);
  };

  const getBarWidth = (amount: number): string => {
    const maxAmount = getMaxAmount();
    const percentage = (amount / maxAmount) * 100;
    return `${Math.min(percentage, 100)}%`;
  };
  
  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Debt Calculator</h2>
        <p className="text-gray-500 text-center py-4">
          Add participants first to see debt calculations.
        </p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Debt Calculator</h2>
        <p className="text-gray-500 text-center py-4">
          Add some expenses first to see debt calculations.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Debt Calculator</h2>

      {/* Individual Balances */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Individual Balances</h3>
        <p className="text-xs text-gray-500 mb-3">
          Net balance per person (+ ahead, - behind)
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {balances.map((balance) => (
            <div
              key={balance.name}
              className="flex justify-between items-center p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <span className="font-medium text-gray-800 text-sm">{balance.name}</span>
              <span
                className={`font-semibold text-sm ${
                  balance.amount > 0
                    ? 'text-green-600'
                    : balance.amount < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {balance.amount === 0 
                  ? formatCurrency(0) 
                  : (balance.amount > 0 ? '+' : '') + formatCurrency(balance.amount)
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Spending Details Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowSpendingDetails(!showSpendingDetails)}
          className="flex items-center justify-between w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
        >
          <span className="font-medium text-blue-800">Spending Details</span>
          <svg
            className={`w-5 h-5 text-blue-600 transition-transform ${showSpendingDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Spending Details Content */}
      {showSpendingDetails && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Spending Breakdown</h4>
          <div className="space-y-4">
            {stats.map((participant) => (
              <div key={participant.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium text-gray-800 text-sm">{participant.name}</h5>
                  <div className="text-xs text-gray-600">
                    Net: <span className={`font-semibold ${participant.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {participant.netBalance >= 0 ? '+' : ''}{formatCurrency(participant.netBalance)}
                    </span>
                  </div>
                </div>
                
                {/* Total Paid Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Paid</span>
                    <span>{formatCurrency(participant.totalPaid)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: getBarWidth(participant.totalPaid) }}
                    ></div>
                  </div>
                </div>

                {/* Total Owed Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Owed</span>
                    <span>{formatCurrency(participant.totalOwed)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: getBarWidth(participant.totalOwed) }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded"></div>
                <span className="text-gray-600">Total Paid</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded"></div>
                <span className="text-gray-600">Total Owed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Settlements */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-3">Settlement Plan</h3>
        {settlements.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            All debts are already settled! 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{settlement.from}</span>
                  <span className="text-gray-500">→</span>
                  <span className="font-medium text-gray-800">{settlement.to}</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(settlement.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {settlements.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>Summary:</strong> {settlements.length} transaction{settlements.length !== 1 ? 's' : ''} needed to settle all debts.
          </p>
        </div>
      )}
    </div>
  );
} 