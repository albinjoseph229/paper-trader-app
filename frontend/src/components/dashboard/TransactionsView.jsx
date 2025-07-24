// src/components/dashboard/TransactionsView.jsx
import React from 'react';

export default function TransactionsView({ transactions }) {
  // Sort transactions by date, most recent first
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Transaction History
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b-2 border-gray-700">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Ticker</th>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Quantity</th>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Price</th>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">P/L</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="p-4 text-gray-400">{new Date(tx.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className={`p-4 font-bold ${tx.transaction_type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.transaction_type}
                  </td>
                  <td className="p-4 font-medium text-white">{tx.stock_ticker}</td>
                  <td className="p-4 text-gray-300 text-right">{tx.quantity}</td>
                  <td className="p-4 text-gray-300 text-right">₹{tx.price_per_share.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className={`p-4 font-semibold text-right ${
                    tx.profit_or_loss > 0 ? 'text-green-400' : tx.profit_or_loss < 0 ? 'text-red-400' : 'text-gray-500'
                  }`}>
                    {tx.transaction_type === 'SELL' ? `₹${tx.profit_or_loss.toLocaleString('en-IN', {minimumFractionDigits: 2})}` : '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-12">
                  <div className="text-4xl mb-3">💳</div>
                  <h4 className="text-lg font-semibold text-white mb-1">No Transactions Yet</h4>
                  <p className="text-gray-500">
                    Your trade history will appear here once you buy or sell stocks.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
