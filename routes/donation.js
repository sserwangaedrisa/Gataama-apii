const express = require('express');
const DonationsController = require('../controllers/donations');
const checkAuth = require('../middleware/check-auth');
const validation = require('../middleware/validation');

const router = express.Router();

/**
 * @openapi
 * /donate/getPaymentUrl:
 *   post:
 *     tags:
 *       - Donation
 *     summary: create donation payment link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkCreationModel'
 *     responses:
 *       200:
 *         description: success
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 url:
 *                   type: string
 *       403:
 *         description: invalid amount set
 *       500:
 *         description: error
 */
router.post('/getPaymentUrl', validation.getPaymentUrlPolicy, DonationsController.getPaymentUrl);

/**
 * @openapi
 * /donate/webhook:
 *   get:
 *     tags:
 *       - Donation
 *     summary:
 */
router.get('/webhook', DonationsController.webhookUrl);

router.get('/getCurrencies', DonationsController.getCurrencies);

router.get('/adminAnalytics', checkAuth, DonationsController.getAdminAnalytics);

module.exports = router;
