"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Login = () => {
  const router = useRouter();

  // State for handling form inputs
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // State for form validation error
  const [error, setError] = useState('');

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !password) {
      setError('Both fields are required.');
      return;
    }
    // Proceed with login and redirect
    setError('');
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Centered content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 hover:scale-105">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-3 rounded-2xl inline-block mb-4">
              <Image src="/Logo.png" alt="Logo" className='filter brightness-95 w-fit m-auto' width={190} height={80} />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-300 text-lg">Sign in to your User dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm text-white mb-2">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm text-white mb-2">Your Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="flex w-full">
              <button
                type="submit"
                className="px-6 py-3 w-full cursor-pointer rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Secure admin access • Protected by encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
