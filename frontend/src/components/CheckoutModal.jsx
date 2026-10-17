import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
  ExternalLink,
  Copy,
  QrCode,
  CreditCard,
  Clock,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api, RAZORPAY_ME_LINK, RAZORPAY_ME_HANDLE } from '../services/api';
import { usePurchases } from '../context/PurchaseContext';
import { useToast } from '../context/ToastContext';
import { useUserAuth } from '../context/UserAuthContext';

export default function CheckoutModal({ media, isOpen, onClose, onUnlocked }) {
  const { user } = useUserAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('direct-link'); // 'direct-link' or 'gateway'
  const [submittedOrder, setSubmittedOrder] = useState(null); // { orderId, utr, status }
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const { savePurchase } = usePurchases();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
      setIsCheckingStatus(false);
      if (user?.name) setCustomerName(user.name);
    } else {
      setSubmittedOrder(null);
      setPaymentRef('');
    }
  }, [isOpen, user]);

  // Polling order status if pending verification
  useEffect(() => {
    if (!isOpen || !submittedOrder?.orderId || submittedOrder.status !== 'pending_verification') {
      return;
    }

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await api.checkOrderStatus(submittedOrder.orderId);
        if (!isMounted) return;

        if (res.status === 'paid') {
          clearInterval(interval);
          setSubmittedOrder((prev) => ({ ...prev, status: 'paid' }));

          if (res.recoveryCode || res.purchaseToken) {
            savePurchase({
              mediaId: media._id,
              purchaseToken: res.purchaseToken,
              recoveryCode: res.recoveryCode
            });
          }

          addToast(`🎉 Admin Approved! "${media.title}" Unlocked!`, 'success');

          if (onUnlocked) {
            onUnlocked({
              mediaId: media._id,
              purchaseToken: res.purchaseToken,
              recoveryCode: res.recoveryCode
            });
          }

          setTimeout(() => {
            onClose();
            navigate('/payment/success', {
              state: {
                media,
                orderId: res.orderId,
                paymentId: res.paymentId,
                recoveryCode: res.recoveryCode,
                purchaseToken: res.purchaseToken
              }
            });
          }, 1000);
        } else if (res.status === 'rejected') {
          clearInterval(interval);
          setSubmittedOrder(null);
          setError('❌ அட்மின் உங்கள் கட்டணத்தை நிராகரித்துவிட்டார்: ' + (res.message || 'வங்கி கணக்கில் பணம் வரவில்லை.'));
        }
      } catch (err) {
        console.error('Polling status error:', err);
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, submittedOrder?.orderId, submittedOrder?.status]);

  if (!isOpen || !media) return null;

  const price = media.price || 199;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(RAZORPAY_ME_LINK)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(RAZORPAY_ME_LINK);
    setCopied(true);
    addToast('Razorpay payment link copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Submits UTR for Admin Verification (Photo stays locked until approved)
   */
  const handleSubmitUtr = async (e) => {
    if (e) e.preventDefault();
    const trimmedUtr = (paymentRef || '').trim();

    if (!trimmedUtr) {
      setError('⚠️ முதலில் ₹' + price + ' பணம் செலுத்திவிட்டு, உங்கள் UPI App (Google Pay / PhonePe / Paytm)-ல் உள்ள 12-இலக்க UTR எண்ணை உள்ளிடவும்!');
      return;
    }

    if (trimmedUtr.length < 8) {
      setError('⚠️ தயவுசெய்து சரியான 12-இலக்க UPI UTR எண்ணை உள்ளிடவும் (குறைந்தது 8 எழுத்துக்கள்/எண்கள்).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const sessionRef = sessionStorage.getItem('anon_session_id') || `sess_${Math.random().toString(36).substring(2, 10)}`;
      sessionStorage.setItem('anon_session_id', sessionRef);

      const res = await api.submitUtrPayment({
        mediaId: media._id,
        utrNumber: trimmedUtr,
        customerName: customerName.trim() || 'Guest User',
        customerSessionId: sessionRef
      });

      if (res.success) {
        setSubmittedOrder({
          orderId: res.orderId,
          utr: trimmedUtr,
          status: res.status
        });
        addToast('⏳ Payment request submitted! Admin is verifying against bank records.', 'info');
      } else {
        throw new Error(res.error || 'Failed to submit payment request');
      }
    } catch (err) {
      console.error('Submit UTR error:', err);
      setError(err.message || 'Payment submission failed. Please verify your UTR.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manually re-checks order status immediately
   */
  const handleManualCheckStatus = async () => {
    if (!submittedOrder?.orderId) return;
    setIsCheckingStatus(true);
    setError('');

    try {
      const res = await api.checkOrderStatus(submittedOrder.orderId);
      if (res.status === 'paid') {
        setSubmittedOrder((prev) => ({ ...prev, status: 'paid' }));
        if (res.recoveryCode || res.purchaseToken) {
          savePurchase({
            mediaId: media._id,
            purchaseToken: res.purchaseToken,
            recoveryCode: res.recoveryCode
          });
        }
        addToast(`🎉 Payment Verified & Approved! "${media.title}" Unlocked!`, 'success');
        if (onUnlocked) {
          onUnlocked({
            mediaId: media._id,
            purchaseToken: res.purchaseToken,
            recoveryCode: res.recoveryCode
          });
        }
        setTimeout(() => {
          onClose();
          navigate('/payment/success', {
            state: {
              media,
              orderId: res.orderId,
              paymentId: res.paymentId,
              recoveryCode: res.recoveryCode,
              purchaseToken: res.purchaseToken
            }
          });
        }, 1000);
      } else if (res.status === 'rejected') {
        setSubmittedOrder(null);
        setError('❌ அட்மின் உங்கள் கட்டணத்தை நிராகரித்துவிட்டார்: ' + (res.message || 'வங்கி கணக்கில் பணம் வரவில்லை.'));
      } else {
        addToast('⏳ இன்னும் சரிபார்ப்பில் உள்ளது. அட்மின் ஒப்புதல் அளித்ததும் தானாக Unlock ஆகும்.', 'info');
      }
    } catch (err) {
      setError('Status check failed: ' + err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  /**
   * Standard Razorpay checkout gateway modal
   */
  const handleGatewayPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const orderData = await api.createCheckoutOrder(media._id);
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment order');
      }

      const { orderId, amount, currency, key_id, isMock } = orderData;

      if (isMock || orderId.startsWith('order_mock_')) {
        setLoading(false);
        setActiveTab('direct-link');
        setError(`⚠️ தயவுசெய்து Razorpay Link அல்லது QR Code மூலம் ₹${price} செலுத்திவிட்டு UTR எண்ணை பதிவு செய்து Unlock செய்யவும்.`);
        return;
      }

      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load. Use direct Razorpay Link instead.');
      }

      const options = {
        key: key_id,
        amount: amount,
        currency: currency || 'INR',
        name: 'UnlockMedia Studio',
        description: `Unlock Master: ${media.title.substring(0, 30)}`,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120&q=80',
        order_id: orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            const verification = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              mediaId: media._id
            });

            if (verification.success) {
              savePurchase({
                mediaId: media._id,
                purchaseToken: verification.purchaseToken,
                recoveryCode: verification.recoveryCode
              });

              addToast(`Unlocked "${media.title}" successfully!`, 'success');
              onClose();

              if (onUnlocked) {
                onUnlocked({
                  mediaId: media._id,
                  purchaseToken: verification.purchaseToken,
                  recoveryCode: verification.recoveryCode
                });
              }

              navigate('/payment/success', {
                state: {
                  media,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  recoveryCode: verification.recoveryCode,
                  purchaseToken: verification.purchaseToken
                }
              });
            } else {
              navigate('/payment/failure', {
                state: { media, error: 'Signature verification failed' }
              });
            }
          } catch (verifyErr) {
            setError(verifyErr.message || 'Payment verification failed');
            navigate('/payment/failure', {
              state: { media, error: verifyErr.message }
            });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: 'Customer',
          email: 'anonymous@guest.in',
          contact: '9999999999'
        },
        theme: {
          color: '#4f46e5'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setLoading(false);
        setError(resp.error?.description || 'Payment was declined');
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Could not initiate checkout');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-brand-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-900 leading-tight">
                Unlock Master Media
              </h3>
              <p className="text-xs text-slate-500">
                Verified Payment • Razorpay Official Link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Media Summary Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 flex items-center justify-center">
              <img
                src={media.previewUrl}
                alt={media.title}
                className={`w-full h-full object-cover select-none pointer-events-none ${
                  (media.price === 199 || (media.originalFileName && media.originalFileName.includes('WhatsApp')) || (media.tags && media.tags.includes('199')))
                    ? 'blur-[6.5px] scale-106 brightness-92'
                    : 'blur-[14px] scale-115 brightness-90'
                }`}
              />
              <div className="absolute inset-0 bg-slate-950/25 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                {media.mediaType === 'video' ? '4K Cinema Video Master' : '8K Ultra Photo Master'}
              </span>
              <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                {media.title}
              </h4>
              <p className="text-xs text-slate-500">
                Total Price: <strong className={`font-bold ${price === 1 ? 'text-rose-600 text-sm' : 'text-emerald-600'}`}>₹{price} INR {price === 1 ? '(Special Trial Deal)' : ''}</strong>
              </p>
            </div>
          </div>

          {/* VIEW A: PENDING VERIFICATION STATE (PHOTO REMAINS LOCKED) */}
          {submittedOrder && submittedOrder.status === 'pending_verification' ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-slate-50 border-2 border-amber-300 shadow-sm space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center animate-pulse">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300 inline-block mb-1">
                  ⏳ சரிபார்ப்பு நிலுவையில் உள்ளது (Verification in Progress)
                </span>
                <h4 className="font-display font-extrabold text-base text-slate-900 mt-1">
                  Payment Submitted for Admin Approval
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  உங்கள் <strong>₹{price}</strong> கட்டணம் மற்றும் UTR எண் <strong>{submittedOrder.utr}</strong> அட்மின் பார்வைக்கு சமர்ப்பிக்கப்பட்டுள்ளது.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-amber-200/80 text-left text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-slate-800">{submittedOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted UTR:</span>
                  <span className="font-mono font-bold text-slate-800">{submittedOrder.utr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Photo Status:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Locked (அட்மின் ஒப்புதலுக்காக காத்திருக்கிறது)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-100/50 text-[11px] text-amber-900 text-left leading-normal">
                💡 <strong>எப்படி திறக்கும்?</strong> அட்மின் Rahul தனது வங்கி/Razorpay கணக்கில் உங்கள் கட்டணம் வந்துள்ளதை சரிபார்த்து "Approve" செய்தவுடன் (பொதுவாக 1-3 நிமிடங்களில்), இந்த பக்கம் தானாகவே Unlock ஆகி crystal clear போட்டோவை காண்பிக்கும்.
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={isCheckingStatus}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>{isCheckingStatus ? 'சரிபார்க்கிறது...' : 'Check Status Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittedOrder(null)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs transition-colors"
                >
                  Change UTR
                </button>
              </div>
            </div>
          ) : (
            /* VIEW B: PAYMENT & SUBMISSION FORM */
            <>
              {/* Payment Method Selector Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('direct-link')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'direct-link'
                      ? 'bg-white text-brand-600 shadow-sm'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-brand-500" />
                  <span>Razorpay.me (@ravirahul601)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gateway')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'gateway'
                      ? 'bg-white text-brand-600 shadow-sm'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Card / Netbanking</span>
                </button>
              </div>

              {/* TAB 1: Direct Razorpay Link & UPI QR Code */}
              {activeTab === 'direct-link' && (
                <div className="space-y-4">
                  {/* Step 1: Pay */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-brand-50/40 to-slate-50 border border-brand-100/80 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 text-brand-700 font-bold">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        படி 1: Razorpay Link-ல் ₹{price} செலுத்தவும்
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 bg-white px-2 py-0.5 rounded-md border border-brand-200 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>

                    {/* Primary Action Button: Opens Razorpay.me */}
                    <a
                      href={RAZORPAY_ME_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] transition-all duration-200 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 text-center"
                    >
                      <ExternalLink className="w-4 h-4 text-white" />
                      <span>Pay ₹{price} on Razorpay ({RAZORPAY_ME_HANDLE})</span>
                    </a>

                    {/* QR Code Section */}
                    <div className="pt-2 flex flex-col items-center justify-center text-center">
                      <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm inline-block mb-2">
                        <img
                          src={qrCodeUrl}
                          alt="Razorpay UPI QR Code"
                          className="w-36 h-36 object-contain rounded-lg"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">
                        Scan with Google Pay, PhonePe, Paytm, or BHIM
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        UPI ID / Link: {RAZORPAY_ME_LINK}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Submit UTR for Admin Verification */}
                  <form onSubmit={handleSubmitUtr} className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-900">
                        படி 2: பணம் செலுத்திய 12-இலக்க UTR எண்ணை உள்ளிடவும்
                      </label>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        Google Pay / PhonePe / Paytm-ல் ₹{price} செலுத்திய பின் வரும் <strong>12-digit UTR</strong> எண்ணை பதிவு செய்யவும்.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => {
                          setPaymentRef(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="12-digit UPI UTR (எ.கா: 423987654321)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
                      />

                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="உங்கள் பெயர் / மொபைல் எண் (Optional)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 disabled:opacity-50 transition-all active:scale-[0.99]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>சமர்ப்பிக்கப்படுகிறது...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit UTR for Admin Verification (சரிபார்க்க சமர்ப்பிக்கவும்)</span>
                        </>
                      )}
                    </button>

                    <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-950 leading-tight">
                      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>பாதுகாப்பு குறிப்பு:</strong> போலி எண்களை உள்ளிட்டால் படம் திறக்காது! அட்மின் வங்கி கணக்கை சரிபார்த்து உறுதி செய்த பிறகே படம் crystal-clear ஆக அன்லாக் செய்யப்படும்.
                      </span>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: Standard Gateway */}
              {activeTab === 'gateway' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
                    <p className="font-semibold text-slate-800">Standard Razorpay Gateway Checkout</p>
                    <p>
                      Pay securely using Credit Cards, Debit Cards, Netbanking, or Wallets via the Razorpay popup gateway.
                    </p>
                  </div>

                  <button
                    onClick={handleGatewayPayment}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-brand-600 active:scale-[0.99] transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white text-white" />
                        <span>Pay ₹{price} with Cards / Gateway</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Razorpay Official
            </span>
            <span>•</span>
            <span>Admin Verified</span>
            <span>•</span>
            <span>100% Secure Unlock</span>
          </div>

        </div>
      </div>
    </div>
  );
}
