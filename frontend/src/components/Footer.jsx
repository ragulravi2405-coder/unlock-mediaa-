import React from 'react';
import { Link } from 'react-router-dom';
import { Unlock, Shield, FileText, HelpCircle, Lock, Heart, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <Unlock className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                Unlock<span className="text-brand-400">Media</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Instant pay-to-unlock platform for original 8K master photography and 4K cinema video reels. Transparent pricing from ₹99 to ₹199 per item with zero signups or recurring subscriptions.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Razorpay Verified Merchant Checkout • 256-Bit SSL Encrypted</span>
            </div>
          </div>

          {/* Media Discovery */}
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
              Explore Media
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/photos" className="hover:text-white transition-colors">
                  All Photos (8K Masters)
                </Link>
              </li>
              <li>
                <Link to="/videos" className="hover:text-white transition-colors">
                  All Videos (4K Cinema)
                </Link>
              </li>
              <li>
                <Link to="/recover" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Access Recovery</span>
                  <span className="text-[10px] bg-slate-800 text-brand-400 px-1.5 py-0.5 rounded font-mono">Token</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About UnlockMedia
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
              Legal & Trust
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="hover:text-white transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/copyright" className="hover:text-white transition-colors">
                  Copyright & Ownership
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
              Support & Portal
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <span className="text-xs text-slate-500 block leading-tight">
                  Support Email:
                </span>
                <a href="mailto:support@unlockmedia.in" className="text-slate-300 hover:text-white text-xs">
                  support@unlockmedia.in
                </a>
              </li>
              <li className="pt-2">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {currentYear} UnlockMedia Studio. All rights reserved. Registered under Indian Consumer & Digital Media guidelines.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Fixed ₹99 Per Item • No Hidden Fees
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
