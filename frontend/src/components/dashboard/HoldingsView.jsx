// src/components/dashboard/HoldingsView.jsx
import React, { useState } from 'react';
import TradeModal from './TradeModal.jsx'; // Corrected path

const API_KEY = import.meta.env.VITE_EODHD_API_KEY;

export default function HoldingsView({ holdings, onStockClick }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleHoldingClick = async (holding) => {
    setIsLoading(true);
    setError('');
    
    try {
      const url = `https://eodhistoricaldata.com/api/real-time/${holding.stock_ticker}?api_token=${API_KEY}&fmt=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.close) {
        // Call the function passed from the parent to open the modal
        onStockClick({
          symbol: holding.stock_ticker,
          price: data.close,
        });
      } else {
        throw new Error('Could not fetch live price.');
      }
    } catch (err) {
      setError(`Failed to fetch live price for ${holding.stock_ticker}.`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Your Holdings
          </h3>
          {isLoading && <p className="text-sm text-blue-400 animate-pulse">Fetching live price...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b-2 border-gray-700">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Ticker</th>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Quantity</th>
              <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Avg. Purchase Price</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length > 0 ? (
              holdings.map((holding) => (
                <tr 
                  key={holding.id} 
                  className="border-b border-gray-800 hover:bg-gray-700/50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleHoldingClick(holding)}
                >
                  <td className="p-4 font-medium text-white">{holding.stock_ticker}</td>
                  <td className="p-4 text-gray-300 text-right">{holding.quantity}</td>
                  <td className="p-4 text-gray-300 text-right">₹{holding.average_purchase_price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center p-12">
                  <div className="text-4xl mb-3">🗂️</div>
                  <h4 className="text-lg font-semibold text-white mb-1">Your portfolio is empty</h4>
                  <p className="text-gray-500">
                    Use the "Browse & Trade" tab to buy your first stock.
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