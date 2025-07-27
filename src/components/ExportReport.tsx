import { useState } from 'react';
import type { Participant, Expense, Balance, Settlement, ParticipantStats } from '../types';
import { formatCurrency, formatDate, calculateParticipantStats, roundToTwoDecimals } from '../utils';

interface ExportReportProps {
  participants: Participant[];
  expenses: Expense[];
  balances: Balance[];
  settlements: Settlement[];
  stats: ParticipantStats[];
}

export default function ExportReport({ 
  participants, 
  expenses, 
  balances, 
  settlements, 
  stats 
}: ExportReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Create a comprehensive report object
      const report = {
        title: 'DamFair Expense Report',
        generatedAt: new Date().toLocaleString(),
        summary: {
          totalParticipants: participants.length,
          totalExpenses: expenses.length,
          totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
          totalSettlements: settlements.length
        },
        participants: participants.map(p => ({ name: p.name })),
        expenses: expenses.map(expense => ({
          description: expense.description,
          amount: expense.amount,
          payer: expense.payer,
          involved: expense.involved,
          date: formatDate(expense.date),
          sharePerPerson: roundToTwoDecimals(expense.amount / expense.involved.length)
        })),
        balances: balances.map(balance => ({
          name: balance.name,
          amount: balance.amount,
          formattedAmount: formatCurrency(balance.amount)
        })),
        settlements: settlements.map(settlement => ({
          from: settlement.from,
          to: settlement.to,
          amount: settlement.amount,
          formattedAmount: formatCurrency(settlement.amount)
        })),
        detailedStats: stats.map(stat => ({
          name: stat.name,
          totalPaid: stat.totalPaid,
          totalOwed: stat.totalOwed,
          netBalance: stat.netBalance,
          formattedPaid: formatCurrency(stat.totalPaid),
          formattedOwed: formatCurrency(stat.totalOwed),
          formattedBalance: formatCurrency(stat.netBalance)
        }))
      };

      // Generate different export formats
      await exportAsJSON(report);
      await exportAsCSV(report);
      await exportAsText(report);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportAsJSON = async (report: any) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `damfair-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = async (report: any) => {
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Summary
    csvContent += 'Summary\n';
    csvContent += `Total Participants,${report.summary.totalParticipants}\n`;
    csvContent += `Total Expenses,${report.summary.totalExpenses}\n`;
    csvContent += `Total Amount,${formatCurrency(report.summary.totalAmount)}\n`;
    csvContent += `Total Settlements,${report.summary.totalSettlements}\n\n`;
    
    // Balances
    csvContent += 'Individual Balances\n';
    csvContent += 'Name,Amount\n';
    report.balances.forEach((balance: any) => {
      csvContent += `${balance.name},${balance.formattedAmount}\n`;
    });
    csvContent += '\n';
    
    // Settlements
    csvContent += 'Settlement Plan\n';
    csvContent += 'From,To,Amount\n';
    report.settlements.forEach((settlement: any) => {
      csvContent += `${settlement.from},${settlement.to},${settlement.formattedAmount}\n`;
    });
    csvContent += '\n';
    
    // Detailed Stats
    csvContent += 'Detailed Spending Breakdown\n';
    csvContent += 'Name,Total Paid,Total Owed,Net Balance\n';
    report.detailedStats.forEach((stat: any) => {
      csvContent += `${stat.name},${stat.formattedPaid},${stat.formattedOwed},${stat.formattedBalance}\n`;
    });
    csvContent += '\n';
    
    // Expenses
    csvContent += 'Expense Details\n';
    csvContent += 'Description,Amount,Payer,Involved,Date,Share Per Person\n';
    report.expenses.forEach((expense: any) => {
      csvContent += `"${expense.description}",${formatCurrency(expense.amount)},"${expense.payer}","${expense.involved.join(', ')}","${expense.date}",${formatCurrency(expense.sharePerPerson)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `damfair-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsText = async (report: any) => {
    let textContent = '';
    
    // Header
    textContent += `${report.title}\n`;
    textContent += `Generated: ${report.generatedAt}\n`;
    textContent += '='.repeat(50) + '\n\n';
    
    // Summary
    textContent += 'SUMMARY\n';
    textContent += '-'.repeat(20) + '\n';
    textContent += `Total Participants: ${report.summary.totalParticipants}\n`;
    textContent += `Total Expenses: ${report.summary.totalExpenses}\n`;
    textContent += `Total Amount: ${formatCurrency(report.summary.totalAmount)}\n`;
    textContent += `Total Settlements: ${report.summary.totalSettlements}\n\n`;
    
    // Participants
    textContent += 'PARTICIPANTS\n';
    textContent += '-'.repeat(20) + '\n';
    report.participants.forEach((participant: any) => {
      textContent += `• ${participant.name}\n`;
    });
    textContent += '\n';
    
    // Individual Balances
    textContent += 'INDIVIDUAL BALANCES\n';
    textContent += '-'.repeat(20) + '\n';
    report.balances.forEach((balance: any) => {
      const sign = balance.amount >= 0 ? '+' : '';
      textContent += `${balance.name}: ${sign}${balance.formattedAmount}\n`;
    });
    textContent += '\n';
    
    // Settlement Plan
    textContent += 'SETTLEMENT PLAN\n';
    textContent += '-'.repeat(20) + '\n';
    if (report.settlements.length === 0) {
      textContent += 'All debts are already settled! 🎉\n';
    } else {
      report.settlements.forEach((settlement: any, index: number) => {
        textContent += `${index + 1}. ${settlement.from} → ${settlement.to}: ${settlement.formattedAmount}\n`;
      });
    }
    textContent += '\n';
    
    // Detailed Spending Breakdown
    textContent += 'DETAILED SPENDING BREAKDOWN\n';
    textContent += '-'.repeat(30) + '\n';
    report.detailedStats.forEach((stat: any) => {
      textContent += `${stat.name}:\n`;
      textContent += `  Total Paid: ${stat.formattedPaid}\n`;
      textContent += `  Total Owed: ${stat.formattedOwed}\n`;
      textContent += `  Net Balance: ${stat.formattedBalance}\n\n`;
    });
    
    // Expense Details
    textContent += 'EXPENSE DETAILS\n';
    textContent += '-'.repeat(20) + '\n';
    report.expenses.forEach((expense: any, index: number) => {
      textContent += `${index + 1}. ${expense.description}\n`;
      textContent += `   Amount: ${formatCurrency(expense.amount)}\n`;
      textContent += `   Payer: ${expense.payer}\n`;
      textContent += `   Involved: ${expense.involved.join(', ')}\n`;
      textContent += `   Date: ${expense.date}\n`;
      textContent += `   Share per person: ${formatCurrency(expense.sharePerPerson)}\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `damfair-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Export Report</h2>
        <p className="text-gray-500 text-center py-4">
          Add participants first to generate a report.
        </p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Export Report</h2>
        <p className="text-gray-500 text-center py-4">
          Add some expenses first to generate a report.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Export Report</h2>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          Generate a comprehensive report with all calculation details including:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mb-4">
          <li>• Summary of participants and expenses</li>
          <li>• Individual balances and net amounts</li>
          <li>• Settlement plan with transaction details</li>
          <li>• Detailed spending breakdown per person</li>
          <li>• Complete expense history with shares</li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Reports...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report (JSON, CSV, TXT)
            </>
          )}
        </button>

        <div className="text-xs text-gray-500 text-center">
          Downloads 3 files: JSON (structured data), CSV (spreadsheet), and TXT (readable format)
        </div>
      </div>

      {/* Quick Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Participants:</span>
            <span className="font-medium ml-1">{participants.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Expenses:</span>
            <span className="font-medium ml-1">{expenses.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Amount:</span>
            <span className="font-medium ml-1">{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</span>
          </div>
          <div>
            <span className="text-gray-500">Settlements:</span>
            <span className="font-medium ml-1">{settlements.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 