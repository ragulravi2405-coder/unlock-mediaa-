import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ShieldCheck, Search, ArrowRight, Loader2, AlertCircle, CheckCircle2, Film, Image } from 'lucide-react';
import { api } from '../services/api';
import { usePurchases } from '../context/PurchaseContext';
import { useToast } from '../context/ToastContext';

export default function RecoveryPage() {
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveredItem, setRecoveredItem] = useState(null);

  const { savePurchase, unlockedItems, isLoadingLibrary, refreshLibrary } = usePurchases();
  const { addToast } = useToast();

  useEffect(() => {
    refreshLibrary();
  }, []);

  const handleRecover = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setError('Please enter a valid recovery code or payment transaction ID');
      return;
    }

    setLoading(true);
    setError('');
    setRecoveredItem(null);

    const val = inputVal.trim();
    const payload = {};

    if (val.toUpperCase().startsWith('UNLK-')) {
      payload.recoveryCode = val.toUpperCase();
    } else if (val.startsWith('order_')) {
      payload.orderId = val;
    } else if (val.startsWith('pay_')) {
      payload.paymentId = val;
    } else {
      payload.recoveryCode = val.toUpperCase();
    }

    try {
      const res = await api.recoverAccess(payload);
      if (res.success && res.media) {
        setRecoveredItem(res);
        savePurchase({
          mediaId: res.media._id,
          recoveryCode: res.purchase.recoveryCode
        });
        addToast('Media access successfully recovered and linked to your browser!', 'success');
        refreshLibrary();
      } else {
        setError('No active unlocked media was found for this code or reference.');
      }
    } catch (err) {
      console.error('Recovery error:', err);
      setError(err.message || 'Could not locate purchase record with those details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* Title Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold border border-brand-100">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Anonymous Purchase Recovery</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
          Recover Your Unlocked Media
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          UnlockMedia operates without accounts. If you have purchased media on another browser or device, simply enter your <strong className="text-slate-800">Recovery Code</strong> or <strong className="text-slate-800">Razorpay Payment ID</strong> below to restore full access.
        </p>
      </div>

      {/* Recovery Input Form */}
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
        <form onSubmit={handleRecover} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Enter Recovery Code, Order ID, or Payment ID:
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. UNLK-XXXX-XXXX-XXXX or pay_123456789"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Case-insensitive. Hyphens are optional.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-sm text-white bg-slate-900 hover:bg-brand-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locating Access Record...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Restore Access</span>
              </>
            )}
          </button>
        </form>

        {/* Found Result Banner */}
        {recoveredItem && recoveredItem.media && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <img
                src={recoveredItem.media.previewUrl}
                alt={recoveredItem.media.title}
                className="w-14 h-14 rounded-xl object-cover bg-slate-900 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Found & Linked
                </span>
                <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                  {recoveredItem.media.title}
                </h4>
                <p className="text-xs text-emerald-700">
                  Recovery Code: {recoveredItem.purchase.recoveryCode}
                </p>
              </div>
            </div>
            <Link
              to={`/media/${recoveredItem.media.slug || recoveredItem.media._id}`}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Unlocked Master</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* User's Current Local Unlocked Library */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl text-slate-900">
              Unlocked on this Browser
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved in your local anonymous browser storage.
            </p>
          </div>
          <button
            onClick={refreshLibrary}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Refresh List
          </button>
        </div>

        {isLoadingLibrary ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Checking unlocked assets...
          </div>
        ) : unlockedItems.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
            <KeyRound className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-display font-bold text-base text-slate-900">
              No Unlocked Media Found on This Device Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Any photo or video unlocked for ₹99 will automatically appear here on this browser.
            </p>
            <Link
              to="/"
              className="inline-flex px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
            >
              Explore Media Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedItems.map((item) => (
              <div
                key={item.purchaseId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <img
                    src={item.media.previewUrl}
                    alt={item.media.title}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-900 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                      {item.media.mediaType === 'video' ? 'Video Master' : 'Photo Master'}
                    </span>
                    <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                      {item.media.title}
                    </h4>
                    <span className="text-[11px] font-mono font-semibold text-slate-500 block truncate">
                      Code: {item.recoveryCode}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/media/${item.media.slug || item.media._id}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Master</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
