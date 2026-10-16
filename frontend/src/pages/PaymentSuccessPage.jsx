import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Copy, Check, ArrowRight, Download, Eye, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../context/ToastContext';

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const state = location.state || {};
  const { media, orderId, paymentId, recoveryCode } = state;

  useEffect(() => {
    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  const handleCopyCode = () => {
    if (!recoveryCode) return;
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    addToast('Recovery code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!media && !orderId) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-lg">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-2">No Active Transaction Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          You may visit the recovery page if you hold a recovery code from a previous payment.
        </p>
        <Link
          to="/recover"
          className="inline-flex px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          Go to Access Recovery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-10 text-center space-y-6">
        
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Payment Authoritatively Verified
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 mt-3">
            Media Unlocked Successfully!
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Your ₹99 payment has been verified. Access to this individual media item is now active on your device.
          </p>
        </div>

        {/* Media Preview Mini Card */}
        {media && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
            <img
              src={media.previewUrl}
              alt={media.title}
              className="w-16 h-16 rounded-xl object-cover bg-slate-900 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                {media.mediaType === 'video' ? '4K Video Master' : '8K Master Photo'}
              </span>
              <h3 className="font-display font-bold text-sm text-slate-900 truncate">
                {media.title}
              </h3>
              <p className="text-xs text-slate-500">
                Transaction Reference: {paymentId || orderId}
              </p>
            </div>
          </div>
        )}

        {/* Critical Anonymous Recovery Code Card */}
        {recoveryCode && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Anonymous Recovery Code (Save This!)
              </span>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Crucial
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200">
              <span className="font-mono font-extrabold text-base sm:text-lg text-slate-900 tracking-wider">
                {recoveryCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-amber-800 leading-relaxed">
              Because this website requires <strong>no login or account</strong>, this recovery code is your proof of purchase. Save or write down this code so you can re-open this item from any device.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {media && (
            <Link
              to={`/media/${media.slug || media._id}`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-display font-bold text-sm text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Open Unlocked Master Media</span>
            </Link>
          )}

          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>Explore More Media</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
