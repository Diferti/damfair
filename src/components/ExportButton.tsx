import { useState } from 'react';
import type { Participant, Expense, Balance, Settlement, ParticipantStats } from '../types';
import { formatCurrency, formatDate, roundToTwoDecimals } from '../utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  participants: Participant[];
  expenses: Expense[];
  balances: Balance[];
  settlements: Settlement[];
  stats: ParticipantStats[];
}

export default function ExportButton({ 
  participants, 
  expenses, 
  balances, 
  settlements, 
  stats 
}: ExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDFReport = async () => {
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

      await exportAsPDF(report);
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImageExport = async () => {
    setIsGenerating(true);
    
    try {
      await exportAsImage();
    } catch (error) {
      console.error('Error generating image export:', error);
      alert('Error generating image export. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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

  const exportAsImage = async () => {
    // Create a comprehensive report object (same as PDF export)
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

    // Create a temporary div to render the receipt content
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
    
    // Generate HTML content for the receipt image
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
        scrollY: 0,
        logging: false,
        removeContainer: true
      });
      
      // Create download link for the image
      const link = document.createElement('a');
      link.download = `damfair-receipt-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error generating receipt image:', error);
      alert('Error generating receipt image. Please try again.');
    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Export Options</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={generatePDFReport}
          disabled={isGenerating}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as PDF
            </>
          )}
        </button>

        <button
          onClick={generateImageExport}
          disabled={isGenerating}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Image...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Export as Image
            </>
          )}
        </button>
      </div>


    </div>
  );
} 