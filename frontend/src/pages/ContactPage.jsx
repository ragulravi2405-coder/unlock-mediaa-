import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'support',
    orderRef: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitContact(formData);
      if (res.success) {
        setSubmitted(true);
        setTicketId(res.ticketId);
        addToast('Your support inquiry has been submitted!', 'success');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-100">
          Support & Assistance
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
          Contact & Customer Care
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Need help recovering an item, reporting a payment issue, or inquiring about commercial licensing? Our support team responds within 24 to 48 business hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-6 shadow-xl">
            <h3 className="font-display font-bold text-lg text-white">
              Studio Information
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Direct Support Email</span>
                  <a href="mailto:support@unlockmedia.in" className="text-white hover:text-brand-300 font-semibold">
                    support@unlockmedia.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Telephone Helpline</span>
                  <span className="text-white font-semibold">+91 98765 43210</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Mon–Fri: 10:00 AM – 6:00 PM IST</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Studio Office</span>
                  <p className="text-slate-300 leading-relaxed font-semibold">
                    UnlockMedia Studio<br />
                    100 Feet Road, Indiranagar<br />
                    Bengaluru, Karnataka - 560038, India
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              For urgent payment recovery, please keep your Razorpay Payment ID or SMS transaction alert ready.
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
            
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-display font-bold text-2xl text-slate-900">
                  Inquiry Ticket Created
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Thank you. Your message has been routed to our support team. Your tracking reference is:
                </p>
                <div className="inline-block px-4 py-2 rounded-xl bg-slate-100 font-mono text-xs font-bold text-slate-800">
                  Ticket #{ticketId}
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', category: 'support', orderRef: '', subject: '', message: '' }); }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Aditi Sharma"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. aditi@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                    >
                      <option value="support">General Support</option>
                      <option value="recovery">Access / Token Recovery</option>
                      <option value="refund">Refund Request</option>
                      <option value="copyright">Copyright / DMCA Takedown</option>
                      <option value="general">Partnership Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Order / Payment ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.orderRef}
                      onChange={(e) => setFormData({ ...formData, orderRef: e.target.value })}
                      placeholder="e.g. pay_XXXXX or UNLK-XXXX"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief summary of your inquiry"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details regarding your request or technical issue..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-sm text-white bg-slate-900 hover:bg-brand-600 active:scale-[0.99] transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry Ticket</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
