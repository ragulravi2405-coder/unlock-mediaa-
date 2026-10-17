import React from 'react';
import { FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <FileText className="w-3.5 h-3.5 text-brand-600" />
          <span>Legal Agreement & User Terms</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
          Terms & Conditions
        </h1>
        <p className="text-slate-500 text-sm">
          Effective Date: October 2026 • Governing Law: Bengaluru, Karnataka, India
        </p>
      </div>

      {/* Main Content Body */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8 text-slate-700 leading-relaxed text-sm">
        
        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            1. Description of Digital Services
          </h2>
          <p>
            UnlockMedia ("the Platform") operates a digital media catalog consisting of high-resolution master photographs (up to 8K resolution) and cinematic master video footage (up to 4K 60FPS). Visitors can preview watermarked samples for free and purchase uncompressed access to individual media items on a pay-per-item basis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            2. Transparent Pricing & Payment Terms
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Standard Item Price:</strong> Each locked photo or video is sold individually between <strong>₹99 and ₹149 INR</strong> (with special trial offers at ₹1 INR).</li>
            <li><strong>No Recurring Subscriptions:</strong> You are billed once per unlocked media item. There are no recurring monthly charges, membership fees, or unexpected renewals.</li>
            <li><strong>Payment Gateways:</strong> Payments are processed via Razorpay. Accepted instruments include UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards (Visa, MasterCard, RuPay), and Internet Banking across major Indian banks.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            3. Delivery & Grant of Access
          </h2>
          <p>
            Digital access is granted authoritatively upon server-side cryptographic signature verification of your Razorpay payment.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Once confirmed, the watermarked preview is immediately replaced with an uncompressed, protected master stream and download link (where permitted by the copyright holder).</li>
            <li>Unlocking one media item grants access <em>only to that specific media item</em> and does not entitle the buyer to other locked catalog items.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            4. Anonymous Purchase Recovery & User Responsibility
          </h2>
          <p>
            Because UnlockMedia does not require user accounts, passwords, or personal identity profiles, your purchase access is bound to an encrypted <strong>Purchase Token</strong> and a human-readable <strong>Recovery Code</strong> (e.g., <code>UNLK-XXXX-XXXX-XXXX</code>).
          </p>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <strong>Important Consumer Notice:</strong>
            <p>
              It is the purchaser's responsibility to record or copy their recovery code or payment transaction reference upon checkout. While our support team can assist in manual reconciliation using your Razorpay Payment ID, purchases cannot be retrieved if all transaction references are lost.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            5. Intellectual Property & Permitted Use
          </h2>
          <p>
            Purchasing an item grants you a perpetual, non-exclusive, non-transferable personal and commercial project license:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Permitted:</strong> Using the media in marketing campaigns, YouTube video productions, social media visuals, web design, digital art compilations, and physical wall prints.</li>
            <li><strong>Prohibited:</strong> Re-selling, redistributing, syndicating, sublicensing, or bundling the raw master digital files as standalone stock items on competitor platforms.</li>
            <li>All moral and legal copyrights remain with the original creators and UnlockMedia Studio.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            6. Service Availability & Technical Limitations
          </h2>
          <p>
            While we strive for 99.9% platform availability, digital streaming depends on third-party internet service providers, CDN routing, and your device capabilities (e.g. hardware decoding for 4K 60FPS video). We do not guarantee uninterrupted service during scheduled maintenance.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-900">
            7. Dispute Resolution & Jurisdiction
          </h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes or claims arising out of or in connection with this agreement shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka, India</strong>.
          </p>
        </section>

      </div>

    </div>
  );
}
