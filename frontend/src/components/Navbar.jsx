import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Unlock, Image, Video, KeyRound, Menu, X, ShieldCheck } from 'lucide-react';
import { usePurchases } from '../context/PurchaseContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { purchases } = usePurchases();
  const unlockedCount = Object.keys(purchases).length;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Photos', path: '/photos', icon: Image },
    { name: 'Videos', path: '/videos', icon: Video },
    { name: 'About', path: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-header border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Unlock className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                Unlock<span className="text-brand-600">Media</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                ₹99 Pay-to-Unlock
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    active
                      ? 'text-brand-600 bg-brand-50/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 opacity-75" />}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions: Recover / My Unlocked */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/recover"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
              title="Re-open media using your recovery code"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-600" />
              <span>Recover Access</span>
            </Link>

            {unlockedCount > 0 && (
              <Link
                to="/recover"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{unlockedCount} Unlocked</span>
              </Link>
            )}

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>₹99 / Item</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {unlockedCount > 0 && (
              <Link
                to="/recover"
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200"
              >
                {unlockedCount} Unlocked
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                isActive(link.path)
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.icon && <link.icon className="w-5 h-5 text-brand-600" />}
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/recover"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200"
            >
              <KeyRound className="w-4 h-4 text-brand-600" />
              <span>Purchase Recovery & Library</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
