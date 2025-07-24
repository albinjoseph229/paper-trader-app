// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/api';
// 1. Import the toast library
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State for loading indicator
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Use toast.promise for clean loading/success/error states
    toast.promise(
      apiClient.post('/register/', {
        username,
        email,
        password,
      }),
      {
        loading: 'Creating account...',
        success: () => {
          // Redirect to login page after a short delay to allow toast to be seen
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return <b>Registration successful! Please log in.</b>;
        },
        error: (err) => {
          // Display a specific error message from the API if available
          return <b>{err.response?.data?.detail || 'Registration failed. Please try again.'}</b>;
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
        <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl shadow-purple-500/10 border border-gray-700">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white">
            Create an Account
          </h2>
          
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="username" className="text-sm font-medium text-gray-400">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-3 mt-2 text-white bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-400">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 mt-2 text-white bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-400">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 mt-2 text-white bg-gray-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </div>
          </form>
           <p className="text-sm text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:underline">
              Login here
            </Link>
           </p>
        </div>
      </div>
    </>
  );
}