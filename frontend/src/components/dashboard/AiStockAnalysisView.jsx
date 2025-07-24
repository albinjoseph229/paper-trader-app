// src/components/dashboard/AiStockAnalysisView.jsx
import React, { useState } from 'react';
import apiClient from '../../services/api'; // Ensure this path is correct for your project structure

// A helper component to render the AI's response with basic formatting
const AiResponse = ({ text }) => {
    // Split the text by newlines to process each line
    const lines = text.split('\n').map(line => line.trim());

    return (
        <div className="space-y-3 text-gray-300 leading-relaxed">
            {lines.map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                    // Render bold text for titles like **Overall Summary:**
                    return <h4 key={index} className="text-lg font-bold text-purple-300 mt-4">{line.replace(/\*\*/g, '')}</h4>;
                }
                if (line.startsWith('* ') || line.startsWith('- ')) {
                    // Render list items
                    return <p key={index} className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-purple-400">{line.substring(2)}</p>;
                }
                // Render normal paragraphs, ignoring empty lines
                return line ? <p key={index}>{line}</p> : null;
            })}
        </div>
    );
};

// A loading skeleton component to show while the AI is thinking
const AnalysisLoadingSkeleton = () => (
    <div className="mt-6 space-y-4 animate-pulse">
        <div className="h-6 w-1/3 bg-gray-700 rounded-md"></div>
        <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded-md"></div>
            <div className="h-4 w-5/6 bg-gray-700 rounded-md"></div>
        </div>
        <div className="h-6 w-1/4 bg-gray-700 rounded-md mt-4"></div>
        <div className="space-y-2">
            <div className="h-4 w-1/2 bg-gray-700 rounded-md"></div>
            <div className="h-4 w-4/6 bg-gray-700 rounded-md"></div>
        </div>
    </div>
);


export default function AiStockAnalysisView() {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalysis = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      // This endpoint uses the authenticated user's data on the backend
      const response = await apiClient.get('/portfolio/analysis/');
      setAnalysis(response.data.analysis);
    } catch (err) {
      setError('Failed to fetch AI analysis. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    // The main container is now transparent as the parent provides the background
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 p-4 bg-gray-900/30 rounded-xl border border-gray-700/50">
        <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI Portfolio Analysis 🤖
            </h3>
            <p className="text-gray-400 mt-1">Get AI-powered insights and suggestions based on your current holdings.</p>
        </div>
        <button
          onClick={handleAnalysis}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 w-full sm:w-auto"
        >
          {loading ? 'Analyzing...' : 'Analyze My Portfolio'}
        </button>
      </div>

      {error && (
         <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <div className="text-red-400 text-4xl mb-3">⚠</div>
            <h3 className="text-lg font-bold text-red-400 mb-2">Analysis Failed</h3>
            <p className="text-gray-400">{error}</p>
         </div>
      )}
      
      {loading && <AnalysisLoadingSkeleton />}

      {analysis && !loading && (
        <div className="mt-6 bg-gray-900/50 p-6 rounded-xl border border-gray-700/50 animate-fade-in">
          <AiResponse text={analysis} />
        </div>
      )}
    </div>
  );
}
