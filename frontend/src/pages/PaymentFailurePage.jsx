import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, HelpCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function PaymentFailurePage() {
  const location = useLocation();
  const state = location.state || {};
  const { media, error } = state;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-10 text-center space-y-6">
        
        {/* Failure Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Payment Not Completed
          </span>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-3">
            Transaction Incomplete or Cancelled
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            The Razorpay checkout was not verified or was cancelled by the user/issuing bank.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono text-left">
            <strong>Diagnostic:</strong> {error}
          </div>
        )}

        {/* Consumer Assurance Callout */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
          <span className="font-bold block flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Was money deducted from your bank?
          </span>
          <p className="text-[11px] leading-relaxed text-amber-800">
            If your bank account was debited but Checkout failed, Razorpay’s automated reconciliation system will either complete the authorization or reverse the amount back to your original source account within 3 to 5 banking days.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {media ? (
            <Link
              to={`/media/${media.slug || media._id}`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-display font-bold text-sm text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Payment (₹{media.price || 99})</span>
            </Link>
          ) : (
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-display font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gallery</span>
            </Link>
          )}

          <Link
            to="/contact"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Contact Support</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
