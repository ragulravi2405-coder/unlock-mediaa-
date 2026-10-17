import React from 'react';
import { RefreshCcw, HelpCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <RefreshCcw className="w-3.5 h-3.5 text-brand-600" />
          <span>Consumer Protection & Dispute Resolution</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
          Refund & Cancellation Policy
        </h1>
        <p className="text-slate-500 text-sm">
          Last Updated: October 2026 • Compliant with Indian Consumer Protection (E-Commerce) Rules
        </p>
      </div>

      {/* Main Content Body */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8 text-slate-700 leading-relaxed text-sm">
        
        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            1. Nature of Digital Goods & Deliveries
          </h2>
          <p>
            At UnlockMedia, our products are non-tangible, irrevocably accessible digital media assets (uncompressed 8K photographs and 4K cinema master video files). Upon successful verification of your payment (₹99 - ₹149, or ₹1 trial) via Razorpay, instant cryptographic access and streaming capabilities are delivered in real time to your device.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            2. Failed and Pending Transactions
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                Scenario A: Payment Failed at Gateway
              </span>
              <p className="text-slate-600">
                If the transaction failed at the Razorpay or bank level (e.g. incorrect OTP, bank downtime, insufficient funds), no order is created on our servers. If your bank temporarily debits the funds, your issuing bank will automatically reverse the transaction within <strong>24 to 72 business hours</strong> without any manual intervention required.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Scenario B: Payment Debited but Content Remains Locked
              </span>
              <p className="text-slate-600">
                In rare instances of transient mobile internet drops during redirect, payment may be debited before the browser submits the callback. Our server automatically reconciles these orders within minutes using authoritative asynchronous Razorpay webhooks.
              </p>
              <p className="text-slate-600">
                If your item remains locked after 10 minutes, simply visit our <Link to="/recover" className="text-brand-600 font-bold underline">Access Recovery Page</Link> and enter your Razorpay Payment ID (found in your bank SMS / UPI app receipt) to instantly restore access.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            3. Duplicate Payments
          </h2>
          <p>
            If a network delay caused you to accidentally execute two consecutive charges for the exact same media item, we will happily investigate and process an immediate full refund for the duplicate transaction.
          </p>
          <p>
            To request a duplicate charge review, submit a ticket via our <Link to="/contact" className="text-brand-600 font-bold underline">Contact Page</Link> specifying both Razorpay Payment IDs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            4. Refund Timelines & Method
          </h2>
          <p>
            Once a refund is approved by our administration team, it is submitted directly to Razorpay's banking network.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>UPI & Netbanking Refunds:</strong> Typically reflected in your account within <strong>2 to 4 banking business days</strong>.</li>
            <li><strong>Credit & Debit Cards:</strong> Typically posted on your credit statement within <strong>5 to 7 banking business days</strong>, depending on the card issuer.</li>
            <li>Refunds are always issued back to the original funding source. We do not issue cash or physical cheques.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            5. Ineligibility for Refunds
          </h2>
          <p>
            Because we offer high-resolution watermarked previews prior to checkout, refunds cannot be granted for:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Change of mind after the master file has been downloaded or streamed.</li>
            <li>Subjective creative dissatisfaction where the delivered asset accurately matches the advertised preview and resolution specs.</li>
            <li>Failure to save or record the anonymous recovery code where no proof of transaction (Payment ID) can be provided.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-900">
            6. How to Submit a Refund Claim
          </h2>
          <p>
            Please send your refund request to <a href="mailto:support@unlockmedia.in" className="text-brand-600 font-bold hover:underline">support@unlockmedia.in</a> or use our support form with:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
            <div>1. Razorpay Payment ID (e.g. pay_XXXXX)</div>
            <div>2. Date & Time of Transaction</div>
            <div>3. Reason for Claim (e.g. duplicate charge, corrupted file)</div>
          </div>
        </section>

      </div>

    </div>
  );
}
