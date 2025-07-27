import type { Expense } from '../types';
import { formatDate, formatCurrency } from '../utils';

interface ControlledExpenseListProps {
  expenses: Expense[];
  onExpenseDeleted: (expenseId: string) => void;
}

export default function ExpenseList({ expenses, onExpenseDeleted }: ControlledExpenseListProps) {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Expenses
        </h2>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-green-600">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-gray-400 text-3xl mb-1">💰</div>
          <p className="text-gray-500">No expenses added yet</p>
          <p className="text-xs text-gray-400">Add your first expense to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-blue-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-base mb-1 truncate">
                    {expense.description}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Paid by</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      💳 {expense.payer}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => onExpenseDeleted(expense.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-all duration-200"
                    title="Delete expense"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="text-xs font-medium text-gray-500">Involved:</span>
                {expense.involved.map((participant, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium"
                  >
                    {participant}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  📅 {formatDate(expense.date)}
                </div>
                <div className="text-xs text-gray-400">
                  {expense.involved.length} participant{expense.involved.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 