const Razorpay = require('razorpay');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  const isConfigured = key_id && key_secret && 
    !key_id.includes('Sample') && 
    !key_id.includes('placeholder') &&
    key_id.startsWith('rzp_');

  if (!isConfigured) {
    return {
      isMock: true,
      key_id: key_id || 'rzp_test_placeholder',
      instance: null
    };
  }

  if (!razorpayInstance) {
    try {
      razorpayInstance = new Razorpay({
        key_id,
        key_secret
      });
      console.log('[Razorpay] Initialized with Key ID:', key_id.substring(0, 8) + '...');
    } catch (err) {
      console.error('[Razorpay Init Error]', err.message);
      return { isMock: true, key_id, instance: null };
    }
  }

  return {
    isMock: false,
    key_id,
    instance: razorpayInstance
  };
};

module.exports = { getRazorpayInstance };
