import { useState, useEffect } from 'react';
import type { Expense, ExpenseFormProps } from '../types';
import { validateExpense } from '../utils';

export default function ExpenseForm({ participants, onExpenseAdded }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [involved, setInvolved] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when participants change
  useEffect(() => {
    if (participants.length > 0) {
      if (!payer) {
        setPayer(participants[0].name);
      }
      // Only set involved participants if they haven't been set yet or if participants list changed
      if (involved.length === 0 || involved.length !== participants.length) {
        setInvolved(participants.map(p => p.name));
      }
    }
  }, [participants]);

  const handleInvolvedChange = (participantName: string, checked: boolean) => {
    if (checked) {
      setInvolved([...involved, participantName]);
    } else {
      setInvolved(involved.filter(name => name !== participantName));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData = {
      description: description.trim(),
      amount: parseFloat(amount),
      payer,
      involved
    };

    const validationErrors = validateExpense(expenseData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: expenseData.description,
      amount: expenseData.amount,
      payer: expenseData.payer,
      involved: expenseData.involved,
      date: new Date().toISOString()
    };

    // Notify parent component
    onExpenseAdded(newExpense);

    // Reset form
    setDescription('');
    setAmount('');
    setPayer(participants.length > 0 ? participants[0].name : '');
    setInvolved(participants.map(p => p.name)); // Reset to all participants
    setErrors([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Expense
        </h2>
        <p className="text-gray-500 text-center py-4">
          Please add participants first before adding expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Expense
      </h2>
      
      <form onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Dinner at restaurant"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Payer */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Who Paid? *
          </label>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <button
                key={participant.id}
                type="button"
                onClick={() => setPayer(participant.name)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${payer === participant.name 
                    ? 'bg-green-500 text-white shadow-md hover:bg-green-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }
                `}
              >
                {participant.name}
                {payer === participant.name && (
                  <span className="ml-1 text-xs">💳</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Involved Participants */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Involved Participants *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInvolved(participants.map(p => p.name))}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setInvolved([])}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => {
              const isSelected = involved.includes(participant.name);
              return (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => handleInvolvedChange(participant.name, !isSelected)}
                  className={`
                    px-3 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    }
                  `}
                >
                  {participant.name}
                  {isSelected && (
                    <span className="ml-1 text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
          
          {involved.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              Please select at least one participant
            </p>
          )}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-4">
            {errors.map((error, index) => (
              <p key={index} className="text-red-500 text-sm">
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
} 