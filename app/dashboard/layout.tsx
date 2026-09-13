"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Resumen', path: '/dashboard' },
    { name: 'Cumplimiento', path: '/dashboard/cumplimiento' },
    { name: 'Matriz', path: '/dashboard/matriz' },
    { name: 'Mercado', path: '/dashboard/mercado' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col xl:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="xl:hidden sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm font-sans">ES</span>
          </div>
          <span className="text-white font-sans font-bold text-lg tracking-tight">EcoStream</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-400 hover:text-white p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-[72px] z-40 bg-gray-950/95 backdrop-blur-xl p-6 flex flex-col overflow-y-auto">
          <nav className="space-y-2 font-sans mb-8">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-2xl text-base font-semibold transition-all ${
                    isActive 
                      ? 'bg-primary/20 text-white border border-primary/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-gray-800/60 pt-6">
            <ThemeToggle />
          </div>
        </div>
      )}

      {/* Floating Sidebar (Desktop) */}
      <aside className="hidden xl:flex fixed top-6 left-6 bottom-6 w-64 bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex-col z-50">
        
        {/* Brand / Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,73,119,0.5)] border border-blue-500/30">
            <span className="text-white font-bold text-lg font-sans">ES</span>
          </div>
          <span className="text-white font-sans font-bold text-xl tracking-tight">EcoStream</span>
        </div>
        
        {/* Simulator Status Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary/15 border border-secondary/20 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-xs font-semibold text-secondary font-sans tracking-wide">Modo: Simulación Activa</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 font-sans flex flex-col overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ease-in-out ${
                  isActive 
                    ? 'bg-primary/20 text-white border border-primary/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-6 border-t border-gray-800/60 pt-6 text-center">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      {/* xl:ml-[18rem] para escritorio (para dejar espacio al sidebar flotante) */}
      <main className="flex-1 xl:ml-[18rem] min-h-[calc(100vh-72px)] xl:min-h-screen">
        <div className="w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
