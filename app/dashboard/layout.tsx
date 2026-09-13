"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Resumen', path: '/dashboard' },
    { name: 'Cumplimiento', path: '/dashboard/cumplimiento' },
    { name: 'Matriz', path: '/dashboard/matriz' },
    { name: 'Mercado', path: '/dashboard/mercado' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Floating Sidebar */}
      <aside className="fixed top-6 left-6 bottom-6 w-64 bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col z-50">
        
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
        <nav className="flex-1 space-y-2 font-sans flex flex-col">
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
        <div className="mt-auto border-t border-gray-800/60 pt-6 text-center">
          <p className="text-xs text-gray-500 font-sans font-medium">MVP Hackathon</p>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* ml-[18rem] = 288px (24px left + 256px width + gap) */}
      <main className="flex-1 ml-[18rem] min-h-screen">
        {/* The children pages (Resumen, Cumplimiento, etc.) already define their own internal padding */}
        {children}
      </main>
    </div>
  );
}
