import React, { useState } from 'react';
import { X, User, KeyRound, ArrowRight, Loader2, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';

export default function UserAuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginOrRegister, loading } = useUserAuth();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('தயவுசெய்து உங்கள் பெயரை உள்ளிடவும் (Please enter your name).');
      return;
    }

    if (!password || password.length < 8) {
      setError('பாஸ்வேர்ட் குறைந்தது 8 இலக்கங்கள்/எழுத்துக்கள் இருக்க வேண்டும் (Password must be at least 8 digits/characters).');
      return;
    }

    try {
      await loginOrRegister({ name: name.trim(), password });
      setName('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Authentication error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-brand-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 leading-tight">
                Website Login / Entry
              </h3>
              <p className="text-xs text-slate-500">
                Name & 8-Digit Password • MongoDB Connected
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 text-xs text-brand-950 leading-relaxed">
            ✨ <strong>எளிதான உள்நுழைவு:</strong> உங்கள் பெயரையும் 8-இலக்க பாஸ்வேர்டையும் உள்ளிட்டு உள்ளே செல்லலாம். புதிய பயனர்களுக்கு கணக்கு தானாகவே MongoDB-யில் பதிவாகும்!
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              உங்கள் பெயர் (Your Name)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="எ.கா: Karthik / John"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              8-இலக்க கடவுச்சொல் (8-Digit Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="குறைந்தது 8 இலக்கங்கள் (e.g. 12345678)"
                className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * Must be at least 8 numbers or characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-display font-extrabold text-sm text-white bg-slate-900 hover:bg-brand-600 active:scale-[0.99] transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>உள்நுழைகிறது (Logging in)...</span>
              </>
            ) : (
              <>
                <span>Enter Website / தொடரவும்</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>MongoDB Database Protected & Encrypted</span>
          </div>
        </form>

      </div>
    </div>
  );
}
