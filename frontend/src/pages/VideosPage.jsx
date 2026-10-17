import React, { useState, useEffect } from 'react';
import { Video, RefreshCw, Filter } from 'lucide-react';
import { api } from '../services/api';
import MediaCard from '../components/MediaCard';
import CheckoutModal from '../components/CheckoutModal';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [selectedMediaForCheckout, setSelectedMediaForCheckout] = useState(null);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await api.getMediaList({
        type: 'video',
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        sort: sortBy,
        limit: 24
      });
      if (res.success) {
        setVideos(res.data || []);
        if (res.categories) setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [selectedCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-brand-600 text-xs font-bold mb-3">
            <Video className="w-3.5 h-3.5" />
            <span>Cinematic 4K Footage Collection</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
            All 4K Cinema Reels
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl">
            Drone sweeps, slow motion time-lapses, and cinematic sequences in 4K 60FPS. Unlock individual master video clips from ₹99 to ₹149 each.
          </p>
        </div>

        {/* Sorting options */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="newest">Recently Added</option>
            <option value="popular">Most Unlocked</option>
          </select>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
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

      {/* Videos Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading cinema reels...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-sm text-slate-500">No videos found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((media) => (
            <MediaCard
              key={media._id}
              media={media}
              onUnlockClick={(item) => setSelectedMediaForCheckout(item)}
            />
          ))}
        </div>
      )}

      <CheckoutModal
        media={selectedMediaForCheckout}
        isOpen={Boolean(selectedMediaForCheckout)}
        onClose={() => setSelectedMediaForCheckout(null)}
      />
    </div>
  );
}
