import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Search, Filter, ShieldCheck, Zap, Lock, Unlock, ArrowRight, Play, Image, Layers, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import MediaCard from '../components/MediaCard';
import CheckoutModal from '../components/CheckoutModal';

export default function HomePage() {
  const [mediaList, setMediaList] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all'); // all, photo, video
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checkout modal state
  const [selectedMediaForCheckout, setSelectedMediaForCheckout] = useState(null);

  const loadMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMediaList({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        search: searchQuery || undefined,
        limit: 12
      });

      if (res.success) {
        setMediaList(res.data || []);
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      }
    } catch (err) {
      console.error('Failed to load media:', err);
      setError('Unable to load media gallery right now. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [selectedCategory, selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMedia();
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-brand-50/50 via-slate-50 to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Top Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-800 mb-6 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>No Account Required • ₹99 - ₹149 Razorpay Instant Unlock</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Original 8K Master Photos & <span className="text-brand-600">4K Cinema Reels</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Browse softly blurred teaser photos. Unlock full uncompressed masters from <strong className="text-slate-900 font-bold">₹99 to ₹149 each</strong>. Zero subscription traps.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-xl mx-auto flex items-center bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200"
          >
            <div className="pl-3 pr-2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mountains, 4k drone, cyberpunk, waterfalls..."
              className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Quick Stats Banner */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay Verified Merchant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-600" />
              <span>Instant Cryptographic Unlock</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Private Server Object Storage</span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Discovery Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Gallery Controls Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              Browse Available Media
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select any item to preview before unlocking full master resolution.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="inline-flex p-1 rounded-xl bg-slate-200/70 text-xs font-bold text-slate-600">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('photo')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  selectedType === 'photo' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                <Image className="w-3.5 h-3.5 text-accent-500" />
                Photos
              </button>
              <button
                onClick={() => setSelectedType('video')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  selectedType === 'video' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-brand-500" />
                Videos
              </button>
            </div>
          </div>
        </div>

        {/* Category Horizontal Scroll */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Media Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading master previews...</p>
          </div>
        ) : error ? (
          <div className="p-8 my-8 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto">
            <p className="text-sm text-rose-800 font-semibold mb-3">{error}</p>
            <button
              onClick={loadMedia}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-slate-900">No media found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any items matching your selected criteria. Try changing category filters or clear your search query.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSelectedType('all'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-50 text-brand-600 font-bold text-xs hover:bg-brand-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {mediaList.map((media) => (
              <MediaCard
                key={media._id}
                media={media}
                onUnlockClick={(item) => setSelectedMediaForCheckout(item)}
              />
            ))}
          </div>
        )}

      </section>

      {/* How it Works Section */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-brand-400">
              Simple & Transparent
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-2">
              How Pay-to-Unlock Works
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              We designed UnlockMedia to be straightforward: no accounts, no monthly recurring bills, and instant delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-display font-bold text-lg border border-brand-500/30">
                1
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                Browse & Preview
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Explore watermarked preview photos and low-bandwidth preview video clips without any registration.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center font-display font-bold text-lg border border-accent-500/30">
                2
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                Pay via Razorpay (@ravirahul601)
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Click Unlock from ₹99 and complete payment via Razorpay / UPI (GPay, PhonePe, Paytm, Cards).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-display font-bold text-lg border border-emerald-500/30">
                3
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                Instant Master Unlock
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                The server immediately unlocks the master photo or 4K video clip and gives you an anonymous recovery code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Anonymous Recovery Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-500/20">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-display font-bold text-2xl sm:text-3xl leading-tight">
              Already unlocked an item?
            </h3>
            <p className="text-brand-100 text-sm max-w-md">
              Enter your anonymous recovery code or Razorpay transaction reference to restore your unlocked master downloads instantly.
            </p>
          </div>
          <Link
            to="/recover"
            className="px-6 py-3.5 rounded-2xl bg-white text-brand-600 font-bold text-sm hover:bg-brand-50 transition-colors shadow-md whitespace-nowrap active:scale-95"
          >
            Access Recovery Portal →
          </Link>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        media={selectedMediaForCheckout}
        isOpen={Boolean(selectedMediaForCheckout)}
        onClose={() => setSelectedMediaForCheckout(null)}
      />

    </div>
  );
}
