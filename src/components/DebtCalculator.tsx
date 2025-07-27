import { useState, useEffect } from 'react';
import type { Participant, Expense, Balance, Settlement } from '../types';
import { formatCurrency, roundToTwoDecimals, calculateParticipantStats } from '../utils';

interface DebtCalculatorProps {
  participants: Participant[];
  expenses: Expense[];
}

export default function DebtCalculator({ participants, expenses }: DebtCalculatorProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

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
      
      setBalances(balanceArray);
      calculateSettlements(balanceArray);
    } else {
      setBalances([]);
      setSettlements([]);
    }
  }, [participants, expenses]);
  
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
        <h3 className="text-lg font-medium text-gray-700 mb-3">Individual Balances</h3>
        <p className="text-sm text-gray-600 mb-3">
          Shows how much each person is ahead (+) or behind (-) in the group's total expenses.
        </p>
        
        <div className="space-y-2">
          {balances.map((balance) => (
            <div
              key={balance.name}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
            >
              <span className="font-medium text-gray-800">{balance.name}</span>
              <span
                className={`font-semibold ${
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