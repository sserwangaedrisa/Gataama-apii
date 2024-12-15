const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const Flutterwave = require('flutterwave-node-v3');
const { v4: uuidv4 } = require('uuid');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY,
);
const prisma = new PrismaClient();

module.exports = {
  // Stripe Payment Creation for One-time and Recurring Donations
  async createStripePayment(req, res) {
    const {
      amount,
      currency,
      email,
      donorName,
      isAnonymous,
      isRecurring,
      couponCode,
      donationType
    } = req.body;

    // Determine donor name (use null for anonymous donations)
    const donorNameToSave = isAnonymous ? null : donorName;

    try {
      let couponId = null;
      // Handle coupon validation if provided
      if (couponCode) {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (!coupon || !coupon.valid) {
          return res.status(400).json({
            success: false,
            message: 'Invalid coupon code',
          });
        }
        couponId = coupon.id;
      }

      if (!isRecurring) {
        // Handle one-time donation

        const paymentIntentParams = {
          amount: amount * 100, // Stripe expects amount in cents
          currency,
          receipt_email: email,
          metadata: {
            donorName: donorNameToSave || 'Anonymous',
            purpose: 'Donation',
          },
        };

        if (couponId) {
          paymentIntentParams.coupon = couponId;
        }

        const paymentIntent = await stripe.paymentIntents.create(
          paymentIntentParams,
        );

        // Create transaction record in the database
        const transaction = await prisma.transaction.create({
          data: {
            amount,
            currency,
            email,
            fullNames: donorNameToSave || 'Anonymous',
            status: 'initiated',
            transactionType: 'deposit',
            tx_ref: paymentIntent.id, // Store PaymentIntent ID as reference
            donationType,
          },
        });

        // Create donation record
        await prisma.donation.create({
          data: {
            donorName: donorNameToSave,
            transactionId: transaction.id,
            isRecurring: false,
          },
        });

        return res.json({
          success: true,
          message: 'Donation created successfully',
          clientSecret: paymentIntent.client_secret, // Provide client secret for frontend
        });
      } else {
        // Handle recurring donation

        // Create a product and price for the subscription
        const product = await stripe.products.create({
          name: 'Recurring Donation',
          description: 'Monthly Donation Subscription',
        });

        const price = await stripe.prices.create({
          unit_amount: amount * 100,
          currency,
          recurring: { interval: 'month' },
          product: product.id,
        });

        const sessionParams = {
          payment_method_types: ['card'],
          line_items: [{ price: price.id, quantity: 1 }],
          mode: 'subscription',
          customer_email: email,
          success_url:
            'https://your-domain.com/payment-success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://your-domain.com/payment-cancel',
          metadata: {
            donorName: donorNameToSave || 'Anonymous',
            purpose: 'Recurring Donation',
          },
        };

        if (couponId) {
          sessionParams.discount = { coupon: couponId };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        // Create transaction record for subscription
        const transaction = await prisma.transaction.create({
          data: {
            amount,
            currency,
            email,
            fullNames: donorNameToSave || 'Anonymous',
            status: 'initiated',
            transactionType: 'subscription',
            tx_ref: session.id,
            donationType: 'recurring', // Mark as recurring donation
          },
        });

        // Create donation record
        await prisma.donation.create({
          data: {
            donorName: donorNameToSave,
            transactionId: transaction.id,
            isRecurring: true,
          },
        });

        return res.json({
          success: true,
          message: 'Recurring donation created successfully',
          checkoutUrl: session.url, // Provide URL to redirect to Stripe Checkout
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Stripe Error: ${error.message}`,
      });
    }
  },

  // Flutterwave Payment Creation for One-time and Recurring Donations
  async createFlutterwavePayment(req, res) {
    const {
      amount,
      currency,
      email,
      donorName,
      isAnonymous,
      isRecurring,
      couponCode,
    } = req.body;

    // Determine donor name (use null for anonymous donations)
    const donorNameToSave = isAnonymous ? null : donorName || email;

    try {
      let couponId = null;
      // Validate coupon code if provided
      if (couponCode) {
        const coupon = await flw.Coupons.retrieve(couponCode);
        if (!coupon || coupon.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: 'Invalid or inactive coupon code',
          });
        }
        couponId = coupon.id;
      }

      if (!isRecurring) {
        // Handle one-time payment

        const payload = {
          tx_ref: uuidv4(),
          amount: couponId ? amount - coupon.discountAmount : amount,
          currency,
          redirect_url: 'https://your-domain.com/payment-success',
          customer: { email },
          customizations: {
            title: 'Donation',
            description: 'Donation Payment',
          },
          metadata: { donorName: donorNameToSave },
        };

        const response = await flw.PaymentInitiate(payload);

        if (response.status === 'success') {
          // Create donation record in the database
          await prisma.donation.create({
            data: {
              donorName: donorNameToSave,
              amount,
              currency,
              email,
              transactionId: response.data.tx_ref,
              status: 'pending',
              isRecurring: false,
            },
          });

          return res.json({
            success: true,
            message: 'Donation created successfully',
            paymentLink: response.data.link,
          });
        } else {
          throw new Error('Flutterwave payment initiation failed');
        }
      } else {
        // Handle recurring donation

        const subscriptionPayload = {
          tx_ref: uuidv4(),
          amount: couponId ? amount - coupon.discountAmount : amount,
          currency,
          redirect_url: 'https://your-domain.com/payment-success',
          interval: 'monthly',
          customer: { email },
          customizations: {
            title: 'Recurring Donation',
            description: 'Recurring Donation Payment',
          },
          plan: {
            name: 'Monthly Donation Plan',
            description: 'Recurring monthly donation',
            interval: 'monthly',
            amount: (couponId ? amount - coupon.discountAmount : amount) * 100,
          },
        };

        const response = await flw.SubscriptionCreate(subscriptionPayload);

        if (response.status === 'success') {
          // Create recurring donation record
          await prisma.donation.create({
            data: {
              donorName: donorNameToSave,
              amount,
              currency,
              email,
              transactionId: response.data.tx_ref,
              status: 'pending',
              isRecurring: true,
            },
          });

          return res.json({
            success: true,
            message: 'Recurring donation created successfully',
            paymentLink: response.data.link,
          });
        } else {
          throw new Error('Flutterwave subscription creation failed');
        }
      }
    } catch (error) {
      console.error('Error during payment creation:', error);
      res.status(500).json({
        success: false,
        message: `Flutterwave Error: ${error.message}`,
      });
    }
  },

  // Fetch Donation History by Donor ID
  async getDonationHistoryById(req, res) {
    const { donorId } = req.params;

    try {
      const donations = await prisma.donation.findMany({
        where: { donorId },
        orderBy: { createdAt: 'desc' },
      });

      if (!donations.length) {
        return res.status(404).json({
          success: false,
          message: 'No donations found for this donor.',
        });
      }

      res.status(200).json({
        success: true,
        donations,
      });
    } catch (error) {
      console.error('Error fetching donation history:', error);
      res.status(500).json({
        success: false,
        message: `Error fetching donation history: ${error.message}`,
      });
    }
  },

  // Fetch Donation History by Donor Email
  async getDonationHistoryByEmail(req, res) {
    const { email } = req.params;

    try {
      const donations = await prisma.donation.findMany({
        where: { donorEmail: email },
        orderBy: { createdAt: 'desc' },
      });

      if (!donations.length) {
        return res.status(404).json({
          success: false,
          message: 'No donations found for this donor.',
        });
      }

      res.status(200).json({
        success: true,
        donations,
      });
    } catch (error) {
      console.error('Error fetching donation history:', error);
      res.status(500).json({
        success: false,
        message: `Error fetching donation history: ${error.message}`,
      });
    }
  },

  // Fetch All Donors and Their Donation History
  async fetchAllDonors(req, res) {
    try {
      const donors = await prisma.donation.findMany({
        include: {
          transaction: {
            select: {
              tx_ref: true,
              amount: true,
              status: true,
              currency: true,
            },
          },
        },
      });

      if (!donors.length) {
        return res.status(404).json({
          success: false,
          message: 'No donors found.',
        });
      }

      res.status(200).json({
        success: true,
        donors,
      });
    } catch (error) {
      console.error('Error fetching all donors:', error);
      res.status(500).json({
        success: false,
        message: `Error fetching all donors: ${error.message}`,
      });
    }
  },
};
