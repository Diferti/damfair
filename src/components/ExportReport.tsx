import { useState } from 'react';
import type { Participant, Expense, Balance, Settlement, ParticipantStats } from '../types';
import { formatCurrency, formatDate, calculateParticipantStats, roundToTwoDecimals } from '../utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
      await exportAsPDF(report);
      
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

  const exportAsPDF = async (report: any) => {
    // Create a temporary div to render the report content
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '12px';
    tempDiv.style.lineHeight = '1.4';
    
    // Generate HTML content for the PDF
    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">🦫 DamFair Expense Report</h1>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Fair expense splitting, no drama</p>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">Generated: ${report.generatedAt}</p>
      </div>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Participants</div>
            <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${report.summary.totalParticipants}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Total Expenses</div>
            <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${report.summary.totalExpenses}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Total Amount</div>
            <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${formatCurrency(report.summary.totalAmount)}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Settlements</div>
            <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${report.summary.totalSettlements}</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-size: 16px;">Individual Balances</h2>
        ${report.balances.map((balance: any) => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-weight: 500;">${balance.name}</span>
            <span style="font-weight: bold; color: ${balance.amount > 0 ? '#059669' : balance.amount < 0 ? '#dc2626' : '#6b7280'};">
              ${balance.amount >= 0 ? '+' : ''}${balance.formattedAmount}
            </span>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-size: 16px;">Settlement Plan</h2>
        ${report.settlements.length === 0 ? 
          '<p style="text-align: center; color: #059669; font-weight: bold;">🎉 All debts are already settled!</p>' :
          report.settlements.map((settlement: any, index: number) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
              <span>${index + 1}. ${settlement.from} → ${settlement.to}</span>
              <span style="font-weight: bold; color: #3b82f6;">${settlement.formattedAmount}</span>
            </div>
          `).join('')
        }
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-size: 16px;">Detailed Spending Breakdown</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <thead>
            <tr style="background: #3b82f6; color: white;">
              <th style="padding: 8px; text-align: left; font-size: 12px;">Name</th>
              <th style="padding: 8px; text-align: left; font-size: 12px;">Total Paid</th>
              <th style="padding: 8px; text-align: left; font-size: 12px;">Total Owed</th>
              <th style="padding: 8px; text-align: left; font-size: 12px;">Net Balance</th>
            </tr>
          </thead>
          <tbody>
            ${report.detailedStats.map((stat: any) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px; font-weight: 500; font-size: 12px;">${stat.name}</td>
                <td style="padding: 8px; font-size: 12px;">${stat.formattedPaid}</td>
                <td style="padding: 8px; font-size: 12px;">${stat.formattedOwed}</td>
                <td style="padding: 8px; font-weight: bold; font-size: 12px; color: ${stat.netBalance >= 0 ? '#059669' : '#dc2626'};">
                  ${stat.formattedBalance}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; font-size: 16px;">Expense Details</h2>
        ${report.expenses.map((expense: any, index: number) => `
          <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 15px; background: #fafafa;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
              <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">${index + 1}. ${expense.description}</h3>
              <span style="font-size: 16px; font-weight: bold; color: #3b82f6;">${formatCurrency(expense.amount)}</span>
            </div>
            <div style="font-size: 11px; color: #6b7280;">
              <div style="margin-bottom: 5px;"><strong>Payer:</strong> ${expense.payer}</div>
              <div style="margin-bottom: 5px;"><strong>Date:</strong> ${expense.date}</div>
              <div style="margin-bottom: 5px;"><strong>Share per person:</strong> ${formatCurrency(expense.sharePerPerson)}</div>
              <div><strong>Involved:</strong> ${expense.involved.join(', ')}</div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 11px;">
        <p style="margin: 0;">Made with ❤️ for fair expense splitting</p>
        <p style="margin: 5px 0 0 0;">Works offline. Your data is saved in this browser.</p>
      </div>
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      // Convert the div to canvas
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20); // Account for margins
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      // Save the PDF
      pdf.save(`damfair-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
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
              Export Report (JSON, CSV, TXT, PDF)
            </>
          )}
        </button>

        <div className="text-xs text-gray-500 text-center">
          Downloads 4 files: JSON (structured data), CSV (spreadsheet), TXT (readable format), and PDF (printable report)
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