import React from 'react';
import { ShieldCheck, Lock, FileText, EyeOff } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
          <span>Privacy & Data Protection Notice</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
          Privacy Policy
        </h1>
        <p className="text-slate-500 text-sm">
          Last Updated: October 2026 • Compliant with the Digital Personal Data Protection (DPDP) Act, India
        </p>
      </div>

      {/* Main Content Body */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8 text-slate-700 leading-relaxed text-sm">
        
        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-brand-600" />
            1. Anonymous-First Platform Architecture
          </h2>
          <p>
            UnlockMedia (operated by <strong>UnlockMedia Studio</strong>, Indiranagar, Bengaluru, Karnataka, India - 560038) is architected on a privacy-respecting, zero-signup basis. We deliberately do not operate customer account databases, usernames, passwords, or personal profile systems.
          </p>
          <p>
            Visitors browse our media gallery anonymously. When you make a purchase, entitlements are granted via cryptographic access tokens and human-readable recovery codes rather than personal identifying profiles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            2. Payment Information Handled by Razorpay
          </h2>
          <p>
            All financial transactions are processed securely through <strong>Razorpay Software Private Limited</strong>, an RBI-authorized Payment Aggregator complying with PCI-DSS Level 1 certification.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>We do not collect, view, or store your debit/credit card numbers, CVVs, UPI PINs, or bank login credentials on our servers.</li>
            <li>Razorpay securely transmits payment identifiers (Order ID, Payment ID, signature, payment method type, and masked contact details) back to our backend for transaction verification and anti-fraud reconciliation.</li>
            <li>Razorpay operates under its own Privacy Policy available at razorpay.com/privacy.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            3. Local Storage and Client-Side Technologies
          </h2>
          <p>
            We do not use invasive third-party cross-site advertising cookies or behavioural tracking trackers. We utilize browser <code>localStorage</code> solely for functional necessity:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
            <div><strong>pay_unlock_purchases_v1:</strong> Stores your anonymous purchase tokens and recovery codes locally so that items you have unlocked remain open during your browsing session.</div>
            <div><strong>anon_session_id:</strong> A temporary session identifier generated per visit to ensure anti-replay protection during checkout.</div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            4. Technical Logs & Security Records
          </h2>
          <p>
            To prevent fraud, brute-force recovery attacks, distributed denial-of-service (DDoS), and unauthorized digital asset extraction, our servers temporarily maintain standard server access logs:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>IP addresses and user-agent strings (rate-limited and automatically rotated).</li>
            <li>HTTP request methods, timestamps, and HTTP response codes.</li>
            <li>Payment webhook payloads verified against cryptographic HMAC signatures.</li>
          </ul>
          <p>
            Technical access logs are purged on a rolling 30-day schedule unless required for legal, tax, or fraud investigation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            5. Media Storage & Hosting Architecture
          </h2>
          <p>
            Full-resolution original media files are stored on secure private object storage infrastructure. Public gallery APIs never return original file storage URLs or keys. Original media delivery occurs solely via short-lived, HMAC-signed streaming tokens that expire within minutes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            6. Your Rights & Data Requests
          </h2>
          <p>
            Under the Indian Digital Personal Data Protection Act, you have the right to request information regarding any personal data processed through support forms or payment disputes. Because transactions are anonymous, please provide your Razorpay Payment ID or Recovery Code when inquiring so our grievance officer can locate the relevant record.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-900">
            7. Contact & Grievance Officer
          </h2>
          <p>
            For any privacy inquiries, data deletion requests, or questions regarding this policy, please contact:
          </p>
          <div className="text-xs space-y-1 text-slate-600">
            <div><strong>Data Protection & Grievance Desk:</strong> UnlockMedia Studio</div>
            <div><strong>Address:</strong> Indiranagar, Bengaluru, Karnataka, India - 560038</div>
            <div><strong>Email:</strong> <a href="mailto:support@unlockmedia.in" className="text-brand-600 hover:underline">support@unlockmedia.in</a></div>
            <div><strong>Support Helpline:</strong> +91 98765 43210 (Mon–Fri, 10:00 AM – 6:00 PM IST)</div>
          </div>
        </section>

      </div>

    </div>
  );
}
