const ContactMessage = require('../models/ContactMessage');

/**
 * POST /api/contact
 * Submit support, copyright, recovery, or refund inquiry
 */
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message, category = 'general', orderRef } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Please provide your name, email, subject, and message.' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const newMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      category,
      orderRef: orderRef ? orderRef.trim() : '',
      ipAddress
    });

    return res.status(201).json({
      success: true,
      message: 'Your message has been received. Our support team will get back to you within 24-48 business hours.',
      ticketId: newMessage._id
    });
  } catch (err) {
    console.error('[Contact Error]', err);
    return res.status(500).json({ error: 'Failed to send message: ' + err.message });
  }
};

/**
 * GET /api/admin/contact-messages (Protected Admin)
 */
exports.getMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};
