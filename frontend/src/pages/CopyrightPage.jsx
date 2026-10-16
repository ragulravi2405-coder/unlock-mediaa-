import React from 'react';
import { ShieldCheck, AlertCircle, FileCheck, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CopyrightPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
          <span>Intellectual Property & Licensing Standards</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
          Copyright & Content Ownership
        </h1>
        <p className="text-slate-500 text-sm">
          Compliance with the Indian Copyright Act, 1957 & International Digital Millennium Copyright Act (DMCA)
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8 text-slate-700 leading-relaxed text-sm">
        
        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-brand-600" />
            1. Content Verification & Ownership Policy
          </h2>
          <p>
            UnlockMedia is committed to upholding strict intellectual property integrity. All master photographs, cinema drone reels, and footage available on this platform are either:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Created directly by our in-house cinematographers and visual artists; or</li>
            <li>Licensed exclusively under written distribution agreements with individual copyright holders; or</li>
            <li>Curated from high-resolution creative commons master assets legally authorized for commercial distribution and pay-to-unlock enhancement.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            2. Notice and Takedown Procedure
          </h2>
          <p>
            If you are a copyright owner or an authorized agent and believe in good faith that any photograph or video displayed on UnlockMedia infringes upon your copyright, you may submit a formal Takedown Notice to our Designated Grievance Officer.
          </p>
          <p>
            To be considered effective under Section 52 of the Indian Copyright Act and international DMCA conventions, your notice must include:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div>1. A physical or electronic signature of the person authorized to act on behalf of the owner of the copyright interest.</div>
            <div>2. Identification of the copyrighted work claimed to have been infringed, including registration numbers if applicable.</div>
            <div>3. Exact URL or Media ID on UnlockMedia where the alleged infringing material is located.</div>
            <div>4. Your contact details: Full legal name, telephone number, mailing address, and valid email address.</div>
            <div>5. A statement affirming that you have a good-faith belief that use of the material is not authorized by the copyright owner or the law.</div>
            <div>6. A statement made under penalty of perjury that the information in your notification is accurate.</div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display font-bold text-xl text-slate-900">
            3. Review & Removal Protocol
          </h2>
          <p>
            Upon receipt of a valid and complete infringement notice, our compliance team adheres to the following protocol:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>The challenged media item is immediately unpublished from the public gallery within <strong>24 business hours</strong> pending investigation.</li>
            <li>Protected master files are quarantined to prevent new purchases or stream generation.</li>
            <li>If legitimate rights cannot be conclusively demonstrated, the item is permanently deleted from our servers.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-900">
            4. Designated Copyright Officer
          </h2>
          <p>
            Please direct all copyright notifications to:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
            <div><strong>Attn:</strong> Copyright & Intellectual Property Desk</div>
            <div><strong>Entity:</strong> UnlockMedia Studio</div>
            <div><strong>Email:</strong> <a href="mailto:support@unlockmedia.in" className="text-brand-600 font-bold hover:underline">support@unlockmedia.in</a> (Subject: "DMCA / Copyright Takedown Request")</div>
            <div><strong>Direct Submission:</strong> You may also select the <em>Copyright / DMCA Takedown</em> category on our <Link to="/contact" className="text-brand-600 underline font-semibold">Contact Page</Link>.</div>
          </div>
        </section>

      </div>

    </div>
  );
}
