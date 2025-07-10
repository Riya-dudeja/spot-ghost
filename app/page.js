'use client';

import React from 'react';
import Link from 'next/link';
import BlurText from './BlurText';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 relative overflow-hidden font-sans">
      {/* Chic floating elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-emerald-300/40 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-cyan-300/30 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-300"></div>
      </div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Minimal header */}
      <header className="absolute top-8 left-8 z-20">
        <h1 className="text-xl font-extralight text-white/80 tracking-wider">SpotGhost</h1>
      </header>
      
      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <BlurText
          text="Let's unmask ghost jobs"
          delay={200}
          animateBy="words"
          direction="top"
          className="text-4xl md:text-5xl font-extralight text-white mb-6 tracking-tight"
        />
        
        <p className="text-emerald-100/80 text-lg font-light mb-12 text-center max-w-md tracking-wide">
          Sophisticated AI-powered protection against employment fraud
        </p>
        
        <div className="flex gap-4 items-center">
          <Link 
            href="/signup" 
            className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 hover:border-white/30 transition-all duration-500 font-light tracking-wider shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="px-10 py-4 border border-white/30 text-white hover:bg-white/10 hover:border-white/40 rounded-full transition-all duration-300 font-light tracking-wider backdrop-blur-sm"
          >
            Login
          </Link>
        </div>
      </main>
      
      {/* Chic minimal footer */}
      <footer className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <p className="text-white/40 text-sm font-light tracking-wide">Protecting your career journey</p>
      </footer>
    </div>
  );
}