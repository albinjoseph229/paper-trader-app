// src/components/TradeModal.jsx
import React, { useState } from 'react';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';

export default function TradeModal({ stock, onClose, onTradeSuccess }) {
  const [tradeType, setTradeType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State to manage the success screen after a trade
  const [tradeResult, setTradeResult] = useState(null);

  if (!stock) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = tradeType === 'BUY' ? '/trade/buy/' : '/trade/sell/';
    const payload = {
      ticker: stock.symbol,
      quantity: parseInt(quantity, 10),
      price: parseFloat(stock.price),
    };

    toast.promise(
        apiClient.post(endpoint, payload),
        {
            loading: `${tradeType === 'BUY' ? 'Purchasing' : 'Selling'} ${stock.symbol}...`,
            success: (response) => {
                onTradeSuccess();
                if (tradeType === 'SELL') {
                    setTradeResult({
                        type: 'SELL',
                        profitOrLoss: response.data.profit_or_loss,
                    });
                } else {
                    setTradeResult({ type: 'BUY' });
                }
                return <b>Trade successful!</b>;
            },
            error: (err) => {
                return <b>{err.response?.data?.detail || 'An error occurred.'}</b>;
            }
        }
    ).finally(() => {
        setLoading(false);
    });
  };
  
  const totalPrice = (quantity * stock.price).toFixed(2);

  // If a trade was successful, render the success view
  if (tradeResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md m-4 text-white text-center animate-fade-in border border-gray-700">
          <h3 className="text-2xl font-bold text-green-400 mb-4">Success!</h3>
          
          {tradeResult.type === 'BUY' ? (
            <p className="text-lg text-gray-300">You have successfully purchased {quantity} share(s) of {stock.symbol}.</p>
          ) : (
            <>
              <p className="text-lg text-gray-300">You have successfully sold {quantity} share(s) of {stock.symbol}.</p>
              <div className="bg-gray-900/50 p-4 rounded-xl my-4 border border-gray-700">
                <p className="text-gray-400 text-sm">Realized Profit / Loss</p>
                <p className={`text-3xl font-bold ${tradeResult.profitOrLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{tradeResult.profitOrLoss.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
            </>
          )}

          <button onClick={onClose} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the original trade form
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl p-6 w-full max-w-md m-4 text-white border border-gray-700 shadow-2xl shadow-blue-500/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Trade {stock.symbol}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <p className="mb-6 text-gray-400">Current Market Price: <span className="font-semibold text-blue-400">₹{stock.price.toFixed(2)}</span></p>

        <form onSubmit={handleSubmit}>
          {/* --- UPDATED BUTTON CONTAINER --- */}
          <div className="flex bg-gray-900/50 rounded-xl p-1 mb-6 border border-gray-700 gap-2">
            <button 
              type="button" 
              onClick={() => setTradeType('BUY')} 
              className={`w-1/2 p-2 rounded-lg font-semibold transition-all duration-300 ${
                tradeType === 'BUY' 
                ? 'bg-green-600 shadow-lg shadow-green-500/20 text-white' 
                : 'bg-green-900/50 text-green-400 hover:bg-green-800/60'
              }`}
            >
              BUY
            </button>
            <button 
              type="button" 
              onClick={() => setTradeType('SELL')} 
              className={`w-1/2 p-2 rounded-lg font-semibold transition-all duration-300 ${
                tradeType === 'SELL' 
                ? 'bg-red-600 shadow-lg shadow-red-500/20 text-white' 
                : 'bg-red-900/50 text-red-400 hover:bg-red-800/60'
              }`}
            >
              SELL
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, e.target.value))}
              min="1"
              className="w-full px-4 py-3 text-white bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="bg-gray-900/50 p-4 rounded-xl mb-6 text-center border border-gray-700">
            <p className="text-lg text-gray-300">Total: <span className="font-bold text-white">₹{totalPrice}</span></p>
          </div>
          
          <button type="submit" disabled={loading} className={`w-full p-3 font-bold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 ${tradeType === 'BUY' ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20' : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/20'}`}>
            {loading ? 'Processing...' : `Confirm ${tradeType}`}
          </button>
        </form>
      </div>
    </div>
  );
}
