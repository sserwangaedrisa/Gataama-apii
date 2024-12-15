const express = require('express');
const donationController = require('../controllers/donationController');
const checkAuth = require('../middleware/check-auth');
const validation = require('../middleware/validation');

const router = express.Router();

router.post('/stripe-payment', donationController.createStripePayment);
router.post(
  '/flutterwave-payment',
  donationController.createFlutterwavePayment,
);
// router.post('/stripe-webhook', donationController.handleStripeWebhook);
// router.post(
//   '/flutterwave-webhook',
//   donationController.handleFlutterwaveWebhook,
// );
router.get('/stripe-payment:id', donationController.getDonationHistoryById);
router.get('/stripe-payment', donationController.fetchAllDonors)

module.exports = router;
