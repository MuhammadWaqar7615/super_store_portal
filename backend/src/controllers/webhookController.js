const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const Payment = require('../models/Payment');
const { completeSale } = require('../services/saleService');

const handleStripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({ success: false, message: `Webhook signature verification failed: ${error.message}` });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const paymentIntent = event.data.object;
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id }).session(session);
      if (!payment || payment.webhookEventId === event.id) return;

      payment.webhookEventId = event.id;
      payment.webhookProcessedAt = new Date();

      if (event.type === 'payment_intent.succeeded') {
        await payment.save({ session });
        await completeSale(payment.saleId || payment.referenceId, session);
      } else if (event.type === 'payment_intent.payment_failed') {
        payment.status = 'failed';
        await payment.save({ session });
      }
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Webhook processing failed' });
  } finally {
    await session.endSession();
  }
};

module.exports = { handleStripeWebhook };