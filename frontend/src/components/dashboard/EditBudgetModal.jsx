// src/components/EditBudgetModal.jsx
import React, { useState } from 'react';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';

export default function EditBudgetModal({ currentBudget, onClose, onSuccess }) {
  const [newBudget, setNewBudget] = useState(currentBudget);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    toast.promise(
      apiClient.put('/users/me/budget', { new_budget: parseFloat(newBudget) }),
      {
        loading: 'Saving new budget...',
        success: () => {
          onSuccess(); // Refresh dashboard data
          onClose();   // Close modal
          return <b>Budget updated successfully!</b>;
        },
        error: (err) => {
          return <b>{err.response?.data?.detail || 'Failed to update budget.'}</b>;
        },
      }
    ).finally(() => {
        setLoading(false);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm m-4 text-white border border-gray-700" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-4">Edit Budget</h3>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label htmlFor="budget" className="block text-sm font-medium text-gray-400 mb-1">
              New Budget Amount (₹)
            </label>
            <input
              id="budget"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              min="0"
              step="1000"
              className="w-full px-4 py-3 text-white bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="w-full py-3 font-bold bg-gray-600 hover:bg-gray-500 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="w-full py-3 font-bold bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}