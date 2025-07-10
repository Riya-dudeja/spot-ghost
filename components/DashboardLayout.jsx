'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LogOut, Settings, User } from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Analyze' },
  { href: '/dashboard/report', label: 'Report' },
  { href: '/dashboard/my-reports', label: 'My Reports' },
];

const DashboardLayout = ({ children }) => {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/30 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-400/30 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-grid-pattern opacity-20"></div>
      </div>

      {/* Top Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-50 backdrop-blur-md bg-black/20 border-b border-white/10 sticky top-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">SpotGhost</span>
            </motion.div>

            {/* Nav Links + Profile */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              {/* Links */}
              <div className="hidden md:flex items-center space-x-2 backdrop-blur-sm bg-white/10 rounded-xl p-1 border border-white/20">
                {links.map(({ label, href }) => (
                  <Link key={href} href={href}>
                    <button
                      className={clsx(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 capitalize",
                        pathname === href
                          ? "bg-emerald-500/20 text-emerald-300 shadow-lg backdrop-blur-sm border border-emerald-400/30"
                          : "text-gray-300 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {label}
                    </button>
                  </Link>
                ))}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg text-sm font-medium text-white"
                >
                  JD
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-white/10">
                    <Link
                      href="/dashboard/profile/edit"
                      className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      <User size={16} className="mr-2" /> Edit Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    >
                      <Settings size={16} className="mr-2" /> Settings
                    </Link>
                    <form method="POST" action="/api/auth/logout">
                      <button className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300">
                        <LogOut size={16} className="mr-2" /> Logout
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Page Content */}
      <main className="z-10 relative px-6 py-10 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;


