import { useState, useEffect } from 'react';
import type { Participant, Expense, ParticipantStats } from '../types';
import { formatCurrency, calculateParticipantStats, roundToTwoDecimals } from '../utils';

interface SpendingChartProps {
  participants: Participant[];
  expenses: Expense[];
}

export default function SpendingChart({ participants, expenses }: SpendingChartProps) {
  const [stats, setStats] = useState<ParticipantStats[]>([]);

  // Calculate stats when data changes
  useEffect(() => {
    if (participants.length > 0 && expenses.length > 0) {
      calculateStats();
    } else {
      setStats([]);
    }
  }, [participants, expenses]);

  const calculateStats = () => {
    const statsMap = calculateParticipantStats(participants, expenses);

    // Calculate net balance and convert to array
    const statsArray: ParticipantStats[] = Array.from(statsMap.entries()).map(([name, stats]) => ({
      name,
      totalPaid: roundToTwoDecimals(stats.totalPaid),
      totalOwed: roundToTwoDecimals(stats.totalOwed),
      netBalance: roundToTwoDecimals(stats.totalPaid - stats.totalOwed)
    }));

    setStats(statsArray);
  };

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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Spending Overview</h2>
        <p className="text-gray-500 text-center py-4">
          Add participants first to see spending chart.
        </p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Spending Overview</h2>
        <p className="text-gray-500 text-center py-4">
          Add some expenses first to see spending chart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Spending Overview</h2>
      
      <div className="space-y-6">
        {stats.map((participant) => (
          <div key={participant.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-800">{participant.name}</h3>
              <div className="text-sm text-gray-600">
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
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
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
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: getBarWidth(participant.totalOwed) }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Total Paid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Total Owed</span>
          </div>
        </div>
      </div>
    </div>
  );
} 