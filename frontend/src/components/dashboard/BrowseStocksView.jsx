// src/components/dashboard/BrowseStocksView.jsx
import React, { useState } from 'react';
import TradeModal from './TradeModal.jsx';

const API_KEY = import.meta.env.VITE_EODHD_API_KEY;

export default function BrowseStocksView({ onStockClick, onTradeSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const searchUrl = `https://eodhistoricaldata.com/api/search/${searchTerm}?api_token=${API_KEY}&fmt=json`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!Array.isArray(searchData) || searchData.length === 0) {
        throw new Error(`No stocks found for "${searchTerm}".`);
      }

      const bestMatch = searchData.find(m => m.Exchange === 'NSE' || m.Exchange === 'BSE') || searchData[0];
      const correctSymbol = `${bestMatch.Code}.${bestMatch.Exchange}`;

      const quoteUrl = `https://eodhistoricaldata.com/api/real-time/${correctSymbol}?api_token=${API_KEY}&fmt=json`;
      const quoteResponse = await fetch(quoteUrl);
      const quoteData = await quoteResponse.json();

      if (typeof quoteData !== 'object' || !quoteData.code) {
         throw new Error(`Could not fetch live price data for ${correctSymbol}.`);
      }

      setSearchResult({
        symbol: quoteData.code,
        name: bestMatch.Name,
        price: quoteData.close,
        change: quoteData.change,
        change_p: quoteData.change_p,
        volume: quoteData.volume
      });

    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-700/50">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Search & Trade Stocks 🔎
        </h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter company name or ticker (e.g., Reliance)"
            className="flex-grow bg-gray-800/50 text-white placeholder-gray-500 p-3 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchError && (
          <div className="mt-4 text-center p-3 bg-red-500/10 text-red-400 rounded-lg">
            {searchError}
          </div>
        )}
        
        {searchResult && (
          <div 
            className="mt-6 bg-gray-700/30 p-4 rounded-xl hover:bg-gray-700/50 cursor-pointer border border-gray-700/50 hover:border-gray-600 transition-all"
            onClick={() => onStockClick(searchResult)}
          >
             <h4 className="text-lg font-bold text-blue-300">{searchResult.symbol}</h4>
             <p className="text-sm text-gray-400 mb-3">{searchResult.name}</p>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Price</p>
                  <p className="text-white font-semibold text-lg">₹{searchResult.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Change</p>
                  <p className={`font-semibold text-lg ${searchResult.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {searchResult.change.toFixed(2)}
                  </p>
                </div>
                 <div>
                  <p className="text-gray-500">% Change</p>
                  <p className={`font-semibold text-lg ${searchResult.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {searchResult.change_p.toFixed(2)}%
                  </p>
                </div>
                 <div>
                  <p className="text-gray-500">Volume</p>
                  <p className="text-white font-semibold text-lg">{searchResult.volume.toLocaleString('en-IN')}</p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Placeholder for Top Gainers/Losers */}
      <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-700/50 text-center">
          <p className="text-gray-500">Top Gainers & Losers data is unavailable with the current API plan.</p>
      </div>
    </div>
  );
}
