import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock, Play, Image, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePurchases } from '../context/PurchaseContext';

export default function MediaCard({ media, onUnlockClick }) {
  const { isUnlocked } = usePurchases();
  const unlocked = isUnlocked(media._id);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-brand-200 hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Thumbnail Container */}
      <Link
        to={`/media/${media.slug || media._id}`}
        className="relative aspect-[16/10] overflow-hidden bg-slate-950 block"
      >
        {(() => {
          const isLightBlur = media.price === 199 || (media.originalFileName && media.originalFileName.includes('WhatsApp')) || (media.tags && media.tags.includes('199'));

          return (
            <>
              <img
                src={media.previewUrl}
                alt={media.title}
                loading="lazy"
                className={`w-full h-full object-cover transition-all duration-500 ${
                  !unlocked
                    ? (isLightBlur
                        ? 'blur-[8px] scale-106 brightness-92 contrast-105 select-none pointer-events-none'
                        : 'blur-[16px] scale-115 brightness-90 contrast-110 select-none pointer-events-none')
                    : 'group-hover:scale-105'
                }`}
              />

              {/* Censor Blur Veil Overlay */}
              {!unlocked && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 transition-colors ${
                  isLightBlur
                    ? 'bg-slate-950/30 backdrop-blur-[2px]'
                    : 'bg-slate-950/40 backdrop-blur-[3px]'
                }`}>
                  <div className={`rounded-2xl bg-slate-900/90 border border-white/25 text-amber-400 flex items-center justify-center shadow-xl mb-1.5 ring-2 ring-black/30 ${
                    isLightBlur ? 'w-8 h-8' : 'w-10 h-10'
                  }`}>
                    <Lock className={isLightBlur ? 'w-3.5 h-3.5 text-amber-400' : 'w-4 h-4 text-amber-400'} />
                  </div>
                  <span className="text-[11px] font-bold text-white tracking-wide drop-shadow-md">
                    {isLightBlur ? '✨ Seductive Lite-Blur Preview' : '🔒 Blurred & Censored'}
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold mt-0.5 drop-shadow-sm bg-black/60 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    Pay ₹{media.price || 99} to Unblur & View
                  </span>
                </div>
              )}
            </>
          );
        })()}

        {/* Media Type Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider backdrop-blur-md bg-slate-900/80 text-white border border-white/10 flex items-center gap-1 shadow-sm">
            {media.mediaType === 'video' ? (
              <>
                <Play className="w-3 h-3 text-brand-400 fill-brand-400" />
                <span>Video {media.duration ? `• ${media.duration}s` : ''}</span>
              </>
            ) : (
              <>
                <Image className="w-3 h-3 text-accent-400" />
                <span>Photo</span>
              </>
            )}
          </span>

          {media.price === 1 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md animate-pulse">
              ₹1 TRIAL
            </span>
          )}

          {media.category && media.price !== 1 && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/80 backdrop-blur-md text-slate-800 shadow-sm">
              {media.category}
            </span>
          )}
        </div>

        {/* Unlocked Badge */}
        {unlocked && (
          <div className="absolute top-3 right-3 z-20">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Unlocked</span>
            </span>
          </div>
        )}
      </Link>

      {/* Content Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <Link
            to={`/media/${media.slug || media._id}`}
            className="font-display font-bold text-base text-slate-900 hover:text-brand-600 transition-colors line-clamp-1 mb-1.5"
            title={media.title}
          >
            {media.title}
          </Link>
          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
            {media.description || 'Full resolution master digital file with verified cryptographic unlock.'}
          </p>
        </div>

        {/* Card Footer with Price and Unlock Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {unlocked ? 'Purchased' : (media.price === 1 ? 'Special Offer' : 'One-Time Price')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`font-display font-extrabold text-lg ${media.price === 1 ? 'text-rose-600' : 'text-slate-900'}`}>
                ₹{media.price || 99}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">INR</span>
            </div>
          </div>

          {unlocked ? (
            <Link
              to={`/media/${media.slug || media._id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              <span>View Original</span>
            </Link>
          ) : (
            <button
              onClick={() => onUnlockClick ? onUnlockClick(media) : null}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-sm active:scale-95 ${
                media.price === 1
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-500/25'
                  : 'bg-slate-900 hover:bg-brand-600'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock for ₹{media.price || 99}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
