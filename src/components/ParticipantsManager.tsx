import { useState } from 'react';
import type { Participant, ParticipantsManagerProps } from '../types';
import { STORAGE_KEYS } from '../types';
import { saveToStorage, validateParticipantName } from '../utils';

interface ControlledParticipantsManagerProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
}

export default function ParticipantsManager({ participants, onParticipantsChange }: ControlledParticipantsManagerProps) {
  const [newParticipantName, setNewParticipantName] = useState('');
  const [error, setError] = useState('');

  const addParticipant = () => {
    const validationError = validateParticipantName(newParticipantName, participants);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    // Add new participant
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: newParticipantName.trim()
    };

    const updatedParticipants = [...participants, newParticipant];
    onParticipantsChange(updatedParticipants);
    setNewParticipantName('');
    setError('');
  };

  const removeParticipant = (id: string) => {
    const updatedParticipants = participants.filter(participant => participant.id !== id);
    onParticipantsChange(updatedParticipants);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addParticipant();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Participants</h2>
      
      {/* Add Participant Form */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter participant name"
            value={newParticipantName}
            onChange={(e) => {
              setNewParticipantName(e.target.value);
              setError(''); // Clear error when user types
            }}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addParticipant}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Participants List */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-3">
          Participants ({participants.length})
        </h3>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">👥</div>
            <p className="text-gray-500">No participants added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add participants to start tracking expenses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800">{participant.name}</span>
                </div>
                <button
                  onClick={() => removeParticipant(participant.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all duration-200"
                  title="Remove participant"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 