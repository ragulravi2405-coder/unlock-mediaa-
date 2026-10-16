import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, ShieldCheck, Zap, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { api } from '../services/api';
import { usePurchases } from '../context/PurchaseContext';
import { useToast } from '../context/ToastContext';

export default function CheckoutModal({ media, isOpen, onClose, onUnlocked }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { savePurchase } = usePurchases();
  const { addToast } = useToast();
  const navigate = useNavigate();

  if (!isOpen || !media) return null;

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Request Order Creation from Backend
      const orderData = await api.createCheckoutOrder(media._id);

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment order');
      }

      const { orderId, amount, currency, key_id, isMock } = orderData;

      // 2. If in Dev/Mock Mode (Razorpay keys not yet live/test configured in .env)
      if (isMock || orderId.startsWith('order_mock_')) {
        console.log('[Dev Test Mode] Simulating instant test payment verification...');
        
        // Simulate real Razorpay client response with test signature
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const mockSignature = `sig_mock_${Date.now()}`;

        // Verify with authoritative backend
        const verification = await api.verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
          mediaId: media._id
        });

        if (verification.success) {
          savePurchase({
            mediaId: media._id,
            purchaseToken: verification.purchaseToken,
            recoveryCode: verification.recoveryCode
          });

          addToast(`Unlocked "${media.title}" for ₹${media.price || 99}!`, 'success');
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
              orderId,
              paymentId: mockPaymentId,
              recoveryCode: verification.recoveryCode,
              purchaseToken: verification.purchaseToken
            }
          });
        }
        return;
      }

      // 3. Official Razorpay Checkout Flow
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection or ad-blocker.');
      }

      const options = {
        key: key_id,
        amount: amount,
        currency: currency || 'INR',
        name: 'UnlockMedia Studio',
        description: `Unlock Access: ${media.title.substring(0, 30)}`,
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
                state: {
                  media,
                  error: 'Signature verification failed'
                }
              });
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            setError(verifyErr.message || 'Payment verification failed');
            navigate('/payment/failure', {
              state: {
                media,
                error: verifyErr.message
              }
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
            console.log('Razorpay checkout was dismissed by user.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setLoading(false);
        setError(resp.error?.description || 'Payment was declined by bank');
        navigate('/payment/failure', {
          state: {
            media,
            error: resp.error?.description || 'Payment failed'
          }
        });
      });
      rzp.open();

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Could not initiate checkout');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                Unlock Master Media
              </h3>
              <p className="text-xs text-slate-500">
                1-Click Instant Access • No Account Needed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Media Summary Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 flex items-center justify-center">
              <img
                src={media.previewUrl}
                alt={media.title}
                className="w-full h-full object-cover blur-md scale-125 brightness-75 select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                {media.mediaType === 'video' ? '4K Cinema Reel' : '8K Master Photo'}
              </span>
              <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                {media.title}
              </h4>
              <p className="text-xs text-slate-500">
                Category: {media.category || 'General'}
              </p>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 py-3 border-y border-slate-100 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Full Media License</span>
              <span>₹{media.price || 99}.00</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform & Encryption Fee</span>
              <span className="text-emerald-600 font-medium">FREE (₹0)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes (GST Included)</span>
              <span>₹0.00</span>
            </div>
            <div className="flex justify-between text-slate-900 font-display font-bold text-base pt-2 border-t border-slate-100">
              <span>Total Payable</span>
              <span className="text-brand-600 text-lg">₹{media.price || 99}.00 INR</span>
            </div>
          </div>

          {/* Anonymous Guarantee Callout */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Anonymous Purchase Guarantee</span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                You will not be asked to register. Upon payment, you receive a cryptographic access token and a recovery code you can save to access your unlocked item at any time.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>Proceed to Pay ₹{media.price || 99} via Razorpay</span>
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              UPI, Cards, Netbanking
            </span>
            <span>•</span>
            <span>Instant Access</span>
            <span>•</span>
            <span>Safe & Secure</span>
          </div>

        </div>
      </div>
    </div>
  );
}
