// src/components/ResetAccountModal.jsx
import React, { useState } from 'react';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetAccountModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);

    toast.promise(
      apiClient.post('/users/me/reset'),
      {
        loading: 'Resetting account...',
        success: () => {
          onSuccess(); // Refresh dashboard data
          onClose();   // Close modal
          return <b>Account has been reset!</b>;
        },
        error: (err) => {
          return <b>{err.response?.data?.detail || 'Failed to reset account.'}</b>;
        },
      }
    ).finally(() => {
        setLoading(false);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm m-4 text-white border border-red-700/50 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold mb-2">Reset Account?</h3>
        <p className="text-gray-400 mb-6">
          This will delete all your holdings and transactions, and your budget will be reset to the default amount. This action cannot be undone.
        </p>
        <div className="flex gap-3">
            <button onClick={onClose} className="w-full py-3 font-bold bg-gray-600 hover:bg-gray-500 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleReset} disabled={loading} className="w-full py-3 font-bold bg-red-600 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'Resetting...' : 'Yes, Reset'}
            </button>
          </div>
      </div>
    </div>
  );
}
