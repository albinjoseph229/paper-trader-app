// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';
import HoldingsView from '../components/dashboard/HoldingsView';
import TransactionsView from '../components/dashboard/TransactionsView';
import BrowseStocksView from '../components/dashboard/BrowseStocksView';
import AiStockAnalysisView from '../components/dashboard/AiStockAnalysisView';
import PortfolioAnalysisView from '../components/dashboard/PortfolioAnalysisView';
// --- CORRECTED IMPORTS ---
import EditBudgetModal from '../components/dashboard/EditBudgetModal';
import ResetAccountModal from '../components/dashboard/ResetAccountModal';
import TradeModal from '../components/dashboard/TradeModal';


const API_KEY = import.meta.env.VITE_EODHD_API_KEY;

// --- Helper function to fetch prices with caching ---
const fetchAndCacheLivePrices = async (holdings) => {
  const CACHE_KEY = 'stockPriceCache';
  const today = new Date().toISOString().split('T')[0];
  let cachedData = {};
  try {
    const storedCache = localStorage.getItem(CACHE_KEY);
    cachedData = storedCache ? JSON.parse(storedCache) : { date: null, prices: {} };
  } catch (e) {
    cachedData = { date: null, prices: {} };
  }
  if (cachedData.date !== today) {
    cachedData = { date: today, prices: {} };
  }
  const pricesToFetch = holdings.filter(h => !cachedData.prices[h.stock_ticker]);
  if (pricesToFetch.length > 0) {
    const pricePromises = pricesToFetch.map(async (holding) => {
      try {
        const url = `https://eodhistoricaldata.com/api/real-time/${holding.stock_ticker}?api_token=${API_KEY}&fmt=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.close) return { symbol: holding.stock_ticker, price: data.close };
      } catch (error) {
        console.error(`Failed to fetch price for ${holding.stock_ticker}`, error);
      }
      return { symbol: holding.stock_ticker, price: holding.average_purchase_price };
    });
    const newPrices = await Promise.all(pricePromises);
    newPrices.forEach(p => {
      if (p) cachedData.prices[p.symbol] = p.price;
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
  }
  return cachedData.prices;
};


const TabButton = ({ children, onClick, isActive, icon }) => (
  <button
    onClick={onClick}
    className={`
      group relative px-6 py-3 font-medium rounded-xl transition-all duration-300 ease-out
      ${isActive
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:text-gray-200 hover:scale-102 backdrop-blur-sm'
      }
      border border-gray-700/50 hover:border-gray-600/50
    `}
  >
    <div className="flex items-center gap-2">
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </div>
    {isActive && (
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
    )}
  </button>
);

const StatsCard = ({ title, value, icon, color, subtitle, isLoading = false, onEdit }) => (
  <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/20 hover:-translate-y-1">
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    {onEdit && (
        <button onClick={onEdit} className="absolute top-3 right-3 text-gray-500 hover:text-white text-xs bg-gray-700/50 hover:bg-gray-600/50 px-2 py-1 rounded-md transition-all opacity-0 group-hover:opacity-100">
            Edit
        </button>
    )}
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      {isLoading ? (
        <div className="h-9 w-3/4 bg-gray-700 rounded-md animate-pulse"></div>
      ) : (
        <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
      )}
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animation-delay-150"></div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('holdings');
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null); // State for TradeModal
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      // Don't set loading to true here to avoid full page reload on refresh
      const response = await apiClient.get('/dashboard/');
      setUser(response.data);
    } catch (err) {
      setError('Could not fetch data. Please try again.');
    } finally {
      setLoading(false); // Only set to false on initial load
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const calculateValue = async () => {
      if (user && user.holdings) {
        setIsPortfolioLoading(true);
        const livePrices = await fetchAndCacheLivePrices(user.holdings);
        const totalValue = user.holdings.reduce((acc, holding) => {
          const currentPrice = livePrices[holding.stock_ticker] || holding.average_purchase_price;
          return acc + (currentPrice * holding.quantity);
        }, 0);
        setPortfolioValue(totalValue);
        setIsPortfolioLoading(false);
      } else {
        setPortfolioValue(0);
        setIsPortfolioLoading(false);
      }
    };
    calculateValue();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
  };

  if (loading) return <LoadingSpinner />;
  
  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
        <div className="text-red-400 text-6xl mb-4">⚠</div>
        <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
  
  if (!user) return null;

  const tabs = [
    { id: 'holdings', label: 'My Holdings', icon: '📊' },
    { id: 'analysis', label: 'Portfolio Analysis', icon: '📈' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'browse', label: 'Browse & Trade', icon: '🔍' },
    { id: 'ai-analysis', label: 'AI Analysis', icon: '🤖' }
  ];

  return (
    <>
      {isBudgetModalOpen && (
        <EditBudgetModal
          currentBudget={user.budget}
          onClose={() => setIsBudgetModalOpen(false)}
          onSuccess={fetchDashboardData}
        />
      )}
      {isResetModalOpen && (
        <ResetAccountModal
          onClose={() => setIsResetModalOpen(false)}
          onSuccess={fetchDashboardData}
        />
      )}
      {selectedStock && (
        <TradeModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onTradeSuccess={() => {
            fetchDashboardData();
            setSelectedStock(null);
          }}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900 to-gray-900"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%E3C/g%E3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative z-10 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-2">
                  Welcome back, {user.username}!
                </h1>
                <p className="text-gray-400 text-lg">Track your investments and grow your portfolio</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsResetModalOpen(true)}
                  className="bg-yellow-800/50 hover:bg-yellow-700/70 backdrop-blur-sm text-yellow-300 hover:text-white font-medium py-3 px-6 rounded-xl border border-yellow-700/50 hover:border-yellow-600/50 transition-all duration-300 flex items-center gap-2"
                >
                  <span>⚠️</span>
                  Reset Account
                </button>
                <button 
                  onClick={handleLogout} 
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Available Budget"
                value={`₹${user.budget.toLocaleString('en-IN')}`}
                icon="💰"
                color="text-green-400"
                subtitle="Ready to invest"
                onEdit={() => setIsBudgetModalOpen(true)}
              />
              <StatsCard
                title="Holdings Value"
                value={`₹${portfolioValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                icon="📊" 
                color="text-blue-400"
                subtitle="Current portfolio worth"
                isLoading={isPortfolioLoading}
              />
              <StatsCard
                title="Total Transactions"
                value={user.transactions?.length || 0}
                icon="💳"
                color="text-purple-400"
                subtitle="All time trades"
              />
              <StatsCard
                title="Active Holdings"
                value={user.holdings?.length || 0}
                icon="🏢"
                color="text-yellow-400" 
                subtitle="Different stocks owned"
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-3 mb-8 p-2 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  isActive={activeTab === tab.id}
                  icon={tab.icon}
                >
                  {tab.label}
                </TabButton>
              ))}
            </div>

            {/* Main Content */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl">
              <div className="p-6 md:p-8">
                {activeTab === 'holdings' && <HoldingsView holdings={user.holdings} onStockClick={handleStockSelect} onTradeSuccess={fetchDashboardData} />}
                {activeTab === 'transactions' && <TransactionsView transactions={user.transactions} />}
                {activeTab === 'browse' && <BrowseStocksView onStockClick={handleStockSelect} onTradeSuccess={fetchDashboardData} />}
                {activeTab === 'ai-analysis' && <AiStockAnalysisView />}
                {activeTab === 'analysis' && <PortfolioAnalysisView holdings={user.holdings} transactions={user.transactions} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
