// src/components/dashboard/PortfolioAnalysisView.jsx
import React, { useState, useEffect } from 'react';

const API_KEY = import.meta.env.VITE_EODHD_API_KEY;

// --- Caching logic to fetch prices only once per day ---
const fetchAndCacheLivePrices = async (holdings) => {
  const CACHE_KEY = 'stockPriceCache';
  const today = new Date().toISOString().split('T')[0]; // Get date as 'YYYY-MM-DD'

  let cachedData = {};
  try {
    const storedCache = localStorage.getItem(CACHE_KEY);
    cachedData = storedCache ? JSON.parse(storedCache) : { date: null, prices: {} };
  } catch (e) {
    console.error("Failed to parse cache", e);
    cachedData = { date: null, prices: {} };
  }

  if (cachedData.date !== today) {
    cachedData = { date: today, prices: {} };
  }

  const pricesToFetch = holdings.filter(h => !cachedData.prices[h.stock_ticker]);

  if (pricesToFetch.length > 0) {
    console.log("Fetching new prices for:", pricesToFetch.map(p => p.stock_ticker));
    const pricePromises = pricesToFetch.map(async (holding) => {
      try {
        const url = `https://eodhistoricaldata.com/api/real-time/${holding.stock_ticker}?api_token=${API_KEY}&fmt=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.close) {
          return { symbol: holding.stock_ticker, price: data.close };
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${holding.stock_ticker}`, error);
      }
      return { symbol: holding.stock_ticker, price: holding.average_purchase_price }; // Fallback
    });

    const newPrices = await Promise.all(pricePromises);
    
    newPrices.forEach(p => {
      if (p) {
        cachedData.prices[p.symbol] = p.price;
      }
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
  } else {
    console.log("All prices loaded from cache.");
  }

  return cachedData.prices;
};


export default function PortfolioAnalysisView({ holdings, transactions }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAnalysis = async () => {
      if ((!holdings || holdings.length === 0) && (!transactions || transactions.length === 0)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const livePrices = await fetchAndCacheLivePrices(holdings || []);

      let totalInvested = 0;
      let totalCurrentValue = 0;
      const detailedHoldings = (holdings || []).map(holding => {
        const currentPrice = livePrices[holding.stock_ticker] || holding.average_purchase_price;
        const costBasis = holding.average_purchase_price * holding.quantity;
        const currentValue = currentPrice * holding.quantity;
        const profitOrLoss = currentValue - costBasis;

        totalInvested += costBasis;
        totalCurrentValue += currentValue;
        
        return { ...holding, currentPrice, currentValue, profitOrLoss };
      });
      
      const unrealizedPL = totalCurrentValue - totalInvested;
      
      let totalRealizedPL = 0;
      if (transactions) {
          transactions.forEach(tx => {
              if (tx.transaction_type === 'SELL' && tx.profit_or_loss != null) {
                  totalRealizedPL += parseFloat(tx.profit_or_loss);
              }
          });
      }

      detailedHoldings.sort((a, b) => b.profitOrLoss - a.profitOrLoss);

      setAnalysis({
        totalCurrentValue,
        unrealizedPL,
        totalRealizedPL,
        overallPL: unrealizedPL + totalRealizedPL,
        detailedHoldings,
        bestPerformer: detailedHoldings.length > 0 ? detailedHoldings[0] : null,
        worstPerformer: detailedHoldings.length > 0 ? detailedHoldings[detailedHoldings.length - 1] : null,
      });
      setLoading(false);
    };

    runAnalysis();
  }, [holdings, transactions]);

  // --- STYLED LOADING STATE ---
  if (loading) {
    return (
        <div className="text-center p-12">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white">Analyzing Portfolio...</h3>
            <p className="text-gray-400">Fetching live market data...</p>
        </div>
    );
  }

  // --- STYLED EMPTY STATE ---
  if (!analysis) {
    return (
      <div className="text-center p-12">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-2xl font-bold text-white mb-2">Portfolio Analysis</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          You have no holdings or transactions to analyze. Use the "Browse & Trade" tab to buy your first stock and start building your portfolio.
        </p>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="space-y-8">
      {/* Portfolio Overview Section */}
      <div>
        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Portfolio Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Current Value" value={`₹${analysis.totalCurrentValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`} icon="💼" color="text-white" />
            <StatCard title="Unrealized P/L" value={`₹${analysis.unrealizedPL.toLocaleString('en-IN', {minimumFractionDigits: 2})}`} icon="📈" color={analysis.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'} />
            <StatCard title="Realized P/L" value={`₹${analysis.totalRealizedPL.toLocaleString('en-IN', {minimumFractionDigits: 2})}`} icon="✅" color={analysis.totalRealizedPL >= 0 ? 'text-green-400' : 'text-red-400'} />
            <StatCard title="Total P/L" value={`₹${analysis.overallPL.toLocaleString('en-IN', {minimumFractionDigits: 2})}`} icon="🏆" color={analysis.overallPL >= 0 ? 'text-green-400' : 'text-red-400'} isHighlighted />
        </div>
      </div>

      {/* Detailed Holdings Table */}
      {analysis.detailedHoldings.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Your Holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b-2 border-gray-700">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Symbol</th>
                  <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Quantity</th>
                  <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Avg. Price</th>
                  <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Current Price</th>
                  <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Total Value</th>
                  <th className="p-4 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Unrealized P/L</th>
                </tr>
              </thead>
              <tbody>
                {analysis.detailedHoldings.map(h => (
                  <tr key={h.stock_ticker} className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="p-4 font-medium text-white">{h.stock_ticker}</td>
                    <td className="p-4 text-gray-300 text-right">{h.quantity}</td>
                    <td className="p-4 text-gray-300 text-right">₹{h.average_purchase_price.toFixed(2)}</td>
                    <td className="p-4 text-white font-semibold text-right">₹{h.currentPrice.toFixed(2)}</td>
                    <td className="p-4 text-white font-bold text-right">₹{h.currentValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className={`p-4 font-bold text-right ${h.profitOrLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {h.profitOrLoss.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Movers Section */}
      {analysis.detailedHoldings.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Top Movers (by Unrealized P/L)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MoverCard type="Best" performer={analysis.bestPerformer} />
            <MoverCard type="Worst" performer={analysis.worstPerformer} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPER COMPONENTS FOR STYLING ---

const StatCard = ({ title, value, icon, color, isHighlighted = false }) => (
    <div className={`
        group relative p-5 rounded-2xl transition-all duration-300
        ${isHighlighted 
            ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-blue-500/50' 
            : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
        }
        border hover:border-gray-600/50
    `}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-400 mb-1">{title}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
            <div className="text-3xl opacity-30 group-hover:opacity-60 transition-opacity">{icon}</div>
        </div>
    </div>
);

const MoverCard = ({ type, performer }) => {
    if (!performer || (type === 'Worst' && performer.profitOrLoss >= 0)) return null;

    const isBest = type === 'Best';
    const color = isBest ? 'green' : 'red';

    return (
        <div className={`p-5 rounded-2xl border bg-gradient-to-br from-${color}-500/10 to-gray-900/10 border-${color}-500/20`}>
            <h4 className={`text-lg font-semibold text-${color}-300 mb-2`}>{type} Performer</h4>
            <p className="text-2xl font-bold text-white">{performer.stock_ticker}</p>
            <p className={`text-lg font-semibold text-${color}-400`}>
                {isBest ? '+' : ''}₹{performer.profitOrLoss.toLocaleString('en-IN', {minimumFractionDigits: 2})}
            </p>
        </div>
    );
};

