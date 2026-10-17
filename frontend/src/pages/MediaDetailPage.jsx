import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Zap,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  Share2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { usePurchases } from '../context/PurchaseContext';
import { useToast } from '../context/ToastContext';
import PhotoViewer from '../components/PhotoViewer';
import VideoPlayer from '../components/VideoPlayer';
import CheckoutModal from '../components/CheckoutModal';

export default function MediaDetailPage() {
  const { id } = useParams();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Protected media stream state
  const [accessData, setAccessData] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);

  const { isUnlocked, getPurchase, savePurchase } = usePurchases();
  const { addToast } = useToast();

  const loadMediaItem = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMediaById(id);
      if (res.success && res.data) {
        setMedia(res.data);
      } else {
        setError('Media not found or has been removed');
      }
    } catch (err) {
      console.error('Failed to load media item:', err);
      setError(err.message || 'Media not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMediaItem();
  }, [id]);

  // When media is loaded, check if we hold an active purchase token to request protected stream
  useEffect(() => {
    if (!media) return;

    const purchase = getPurchase(media._id);
    if (purchase && (purchase.purchaseToken || purchase.recoveryCode)) {
      requestAccess(purchase.purchaseToken, purchase.recoveryCode);
    }
  }, [media]);

  const requestAccess = async (purchaseToken, recoveryCode) => {
    if (!media) return;
    setAccessLoading(true);
    try {
      const accessRes = await api.requestMediaAccess(media._id, {
        purchaseToken,
        recoveryCode
      });

      if (accessRes.success && accessRes.unlocked) {
        setAccessData(accessRes);
      }
    } catch (err) {
      console.warn('Could not verify stream token:', err.message);
    } finally {
      setAccessLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: media.title,
        text: `Unlock master media for ₹${media.price || 199}: ${media.title}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Page link copied to clipboard!', 'info');
    }
  };

  const onUnlockedFromModal = (purchaseDetails) => {
    savePurchase(purchaseDetails);
    requestAccess(purchaseDetails.purchaseToken, purchaseDetails.recoveryCode);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading master asset...</p>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-lg">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Media Unavailable</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'This media item does not exist or has been unpublished.'}</p>
        <Link
          to="/"
          className="inline-flex px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  const userHasAccess = Boolean(accessData && accessData.unlocked);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-slate-900">Gallery</Link>
        <span>/</span>
        <Link
          to={media.mediaType === 'video' ? '/videos' : '/photos'}
          className="hover:text-slate-900 capitalize"
        >
          {media.mediaType}s
        </Link>
        <span>/</span>
        <span className="text-slate-900 truncate max-w-xs">{media.title}</span>
      </nav>

      {/* Main Media Preview or Protected Viewer */}
      <div className="w-full">
        {userHasAccess ? (
          media.mediaType === 'video' ? (
            <VideoPlayer
              media={media}
              streamUrl={accessData.streamUrl}
              downloadUrl={accessData.downloadUrl}
              recoveryCode={accessData.purchase?.recoveryCode}
            />
          ) : (
            <PhotoViewer
              media={media}
              streamUrl={accessData.streamUrl}
              downloadUrl={accessData.downloadUrl}
              recoveryCode={accessData.purchase?.recoveryCode}
            />
          )
        ) : (
          /* Blurred Locked Preview */
          (() => {
            const isLightBlur = media.price === 199 || (media.originalFileName && media.originalFileName.includes('WhatsApp')) || (media.tags && media.tags.includes('199'));

            return (
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-[16/10] sm:aspect-[21/9] flex items-center justify-center">
                <img
                  src={media.previewUrl}
                  alt={media.title}
                  className={`w-full h-full object-cover select-none pointer-events-none filter transition-all duration-700 ${
                    isLightBlur
                      ? 'blur-[4.5px] scale-102 brightness-95 contrast-105'
                      : 'blur-[20px] scale-115 brightness-90 contrast-115'
                  }`}
                />

                {/* Censor Blur Overlay */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 transition-colors ${
                  isLightBlur
                    ? 'bg-slate-950/25 backdrop-blur-[1.5px]'
                    : 'bg-slate-950/45 backdrop-blur-[4px]'
                }`}>
                  <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-2xl mb-3 ring-4 ring-amber-500/10">
                    <Lock className="w-7 h-7 text-amber-400" />
                  </div>

                  <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2 backdrop-blur-md">
                    {isLightBlur ? '✨ Seductive Lite-Blur Preview' : '🔒 Blurred & Censored Preview'}
                  </span>

                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white max-w-lg shadow-sm">
                    Unlock High-Definition Master
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-200 max-w-md mt-2 mb-6 leading-relaxed">
                    {isLightBlur
                      ? `Teaser preview is lightly blurred. Pay ₹${media.price || 199} to immediately unblur, unlock, and download the full crystal uncompressed master.`
                      : `Preview is softly blurred. Pay ₹${media.price || 99} to immediately unblur, unlock, and watch or download the full master.`
                    }
                  </p>

                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="px-7 py-3.5 rounded-2xl font-display font-extrabold text-sm text-white transition-all duration-200 flex items-center gap-2 active:scale-95 shadow-xl bg-brand-600 hover:bg-brand-500 shadow-brand-500/30"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Pay ₹{media.price || 99} to Unblur & Unlock Now</span>
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Media Details & Purchase Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Left Column: Description & Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                {media.mediaType}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 border border-brand-100">
                {media.category || 'General'}
              </span>
              {userHasAccess && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Unlocked
                </span>
              )}
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 leading-tight">
              {media.title}
            </h1>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider">
              Asset Overview & Description
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {media.description || 'Full-resolution master digital file. Includes uncompressed dynamic range and licensing for personal and editorial use.'}
            </p>

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                {media.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/70"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider">
              Master File Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Media Format</span>
                <span className="font-bold text-slate-800 uppercase">{media.mimeType || 'Digital Asset'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Resolution</span>
                <span className="font-bold text-slate-800">
                  {media.dimensions?.width ? `${media.dimensions.width} × ${media.dimensions.height}` : (media.mediaType === 'video' ? '4K UHD (3840×2160)' : '8K Master')}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">License Type</span>
                <span className="font-bold text-slate-800">Personal & Project</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Downloadable</span>
                <span className="font-bold text-emerald-600">
                  {media.allowDownload ? 'Yes (Master File)' : 'View-Only Stream'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout / Status Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5 sticky top-24">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Individual Access
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`font-display font-extrabold text-3xl ${media.price === 1 ? 'text-rose-600' : 'text-slate-900'}`}>
                  ₹{media.price || 99}
                </span>
                <span className="text-xs font-semibold text-slate-500">INR</span>
              </div>
            </div>

            {userHasAccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Access Granted!</span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                      This master item is unlocked on your current browser. You can view or download the master above at any time.
                    </p>
                  </div>
                </div>

                {media.allowDownload && accessData.downloadUrl && (
                  <a
                    href={accessData.downloadUrl}
                    download
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Master Asset</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className={`w-full py-3.5 px-4 rounded-xl font-display font-bold text-sm text-white active:scale-[0.99] transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                    media.price === 1
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-500/25'
                      : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/25'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Unlock for ₹{media.price || 99}</span>
                </button>

                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Razorpay (@ravirahul601) Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-500 flex-shrink-0" />
                    <span>Immediate Master Resolution Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>100% Anonymous • No Account Required</span>
                  </div>
                </div>
              </div>
            )}

            {/* Share link button */}
            <button
              onClick={handleShare}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Preview Link</span>
            </button>

          </div>
        </div>

      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        media={media}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onUnlocked={onUnlockedFromModal}
      />

    </div>
  );
}
