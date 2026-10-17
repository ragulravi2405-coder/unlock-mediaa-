import React from 'react';
import { Link } from 'react-router-dom';
import { Unlock, Shield, Zap, Sparkles, CheckCircle2, Heart, Award, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-100">
          Our Philosophy & Mission
        </span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 tracking-tight">
          High-End Digital Media, Without the Subscription Bloat
        </h1>
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Traditional stock photo and video sites force creators into expensive recurring monthly plans. UnlockMedia provides a clean, fair alternative: pay between ₹99 and ₹149 for the single master asset you need.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900">
            Frictionless Access
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            No registration forms, no email verifications, and no password management. Visit, preview, pay securely via Razorpay (@ravirahul601), and immediately unlock.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900">
            Uncompressed Masters
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every photo is delivered at original high-resolution (up to 8K) and videos in high-bitrate 4K 60FPS. Never downgraded or downscaled.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900">
            Transparent Pricing (₹99 - ₹149)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fair individual asset pricing ranging from ₹99 to ₹149 INR. No hidden platform charges, no unexpected subscription renewals.
          </p>
        </div>
      </div>

      {/* Story Narrative */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 space-y-6 text-slate-700 leading-relaxed text-sm">
        <h2 className="font-display font-bold text-2xl text-slate-900">
          Built for Designers, Editors, and Creators
        </h2>
        <p>
          UnlockMedia was created to solve a widespread creator frustration: needing just one high-resolution background, cinematic transition reel, or wallpaper, only to be forced to sign up for a ₹2,500/month recurring plan.
        </p>
        <p>
          We believe high-quality creative work deserves simple, honest licensing. Each locked asset is protected in secure private object storage. When you authorize a payment through Razorpay, our backend verifies the transaction signature authoritatively and issues a short-lived, encrypted stream token along with your permanent recovery code.
        </p>
        <p>
          Whether you are designing a website, cutting a commercial video reel, or printing fine art canvas prints, our master library is ready for instant deployment.
        </p>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Curated by <strong>UnlockMedia Studio</strong> • Indiranagar, Bengaluru, India
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-brand-600 transition-colors"
          >
            <span>Explore Master Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
