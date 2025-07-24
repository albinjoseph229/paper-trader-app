// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api';
// 1. Import the toast library
import toast, { Toaster } from 'react-hot-toast';


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State for loading indicator
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loginData = new URLSearchParams();
    loginData.append('username', username);
    loginData.append('password', password);

    // Use toast.promise for clean loading/success/error states
    toast.promise(
      apiClient.post('/login', loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
      {
        loading: 'Logging in...',
        success: (response) => {
          if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            navigate('/dashboard');
            return <b>Welcome back, {username}!</b>; // Success message
          }
          // This case should ideally not be hit if the API is consistent
          throw new Error('Login failed, please try again.');
        },
        error: (err) => {
          // Display a specific error message from the API if available
          return <b>{err.response?.data?.detail || 'Invalid username or password.'}</b>;
        },
      }
    ).finally(() => {
        setLoading(false);
    });
  };

  return (
    <>
      {/* 2. Add the Toaster component to render the notifications */}
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
            className: '',
            style: {
                background: '#333',
                color: '#fff',
            },
        }}
      />
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-700">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white">
            Sign In
          </h2>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="text-sm font-medium text-gray-400">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-3 mt-2 text-white bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-400">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 mt-2 text-white bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
           <p className="text-sm text-center text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-400 hover:underline">
              Register here
            </Link>
           </p>
        </div>
      </div>
    </>
  );
}
