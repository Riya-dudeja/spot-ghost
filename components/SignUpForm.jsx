'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const SignupForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 409) {
        setStatus('exists');
        setTimeout(() => router.push('/login'), 1500); // redirect after short delay
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Signup failed');

      setStatus('success');
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-14 rounded-3xl shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extralight text-white mb-2 tracking-tight">Join SpotGhost</h2>
        <p className="text-white/70 font-light tracking-wide text-sm">Protect your career journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-light text-white/80 mb-2 tracking-wide">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            onChange={handleChange}
            style={{
              WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.1) inset',
              WebkitTextFillColor: 'white'
            }}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 font-light tracking-wide focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-light text-white/80 mb-2 tracking-wide">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            onChange={handleChange}
            style={{
              WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.1) inset',
              WebkitTextFillColor: 'white'
            }}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 font-light tracking-wide focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-light text-white/80 mb-2 tracking-wide">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            onChange={handleChange}
            style={{
              WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.1) inset',
              WebkitTextFillColor: 'white'
            }}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 font-light tracking-wide focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm"
            placeholder="Create a secure password"
          />
        </div>

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 hover:border-white/30 transition-all duration-500 font-light tracking-wider shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {status === 'loading' ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <p className="text-center text-white/50 mt-6 font-light tracking-wide text-sm">
        Already have an account?{' '}
        <a href="/login" className="text-white/80 hover:text-white transition-colors underline decoration-white/20 hover:decoration-white/40">
          Sign in
        </a>
      </p>

      {/* Feedback */}
      {status === 'success' && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-400/20 rounded-xl text-center backdrop-blur-sm">
          <p className="text-emerald-200 font-light text-sm">Account created successfully! 🎉</p>
        </div>
      )}
      {status === 'exists' && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-xl text-center backdrop-blur-sm">
          <p className="text-yellow-200 font-light text-sm">User already exists — redirecting to login...</p>
        </div>
      )}
      {status && status !== 'success' && status !== 'loading' && status !== 'exists' && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded-xl text-center backdrop-blur-sm">
          <p className="text-red-200 font-light text-sm">{status}</p>
        </div>
      )}
    </div>
  );
};

export default SignupForm;