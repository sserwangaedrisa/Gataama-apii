const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');



dotenv.config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

// Create a payment session
exports.createStripePaymentSession = async (req, res) => {
  try {
    const { amount, currency, donationTitle, donationType, email, fullNames } =
      req.body;

    if (Number(amount) > 0) {
      const tx_ref = uuidv4();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: donationTitle,
                description: `Donation for ${donationType}`,
              },
              unit_amount: amount * 100, // Stripe uses smallest currency unit
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.PAYMENT_URL}/donation-status?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.PAYMENT_URL}/donation-cancelled`,
        metadata: {
          donationType,
          tx_ref,
        },
      });

      // Store the transaction in your database
      await prisma.transaction.create({
        data: {
          tx_ref,
          amount,
          currency,
          donationType,
          email,
          fullNames,
          transactionType: 'deposit',
        },
      });

      res.status(200).send({ url: session.url });
    } else {
      res.status(403).send({ message: 'Invalid amount set' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: process.env.ERROR_MESSAGE });
  }
};

// Handle Stripe Webhook
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

  // Handle manual requests
  if (!sig) {
    console.log('Manual request detected');
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === 'paid') {
        return res
          .status(200)
          .json({ message: 'Payment confirmed successfully!' });
      } else {
        return res.status(400).json({ message: 'Payment not completed' });
      }
    } catch (error) {
      console.error('Error retrieving payment session:', error.message);
      return res.status(500).json({
        message: 'Failed to fetch payment session',
        error: error.message,
      });
    }
  }

  // Handle actual Stripe webhook events
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Retrieve metadata and save the transaction to the database
      const { tx_ref, donationType } = session.metadata;
      const { amount_total, currency } = session;
      const { email, name } = session.customer_details;

      const transaction = await prisma.transaction.create({
        data: {
          tx_ref,
          amount: amount_total / 100,
          currency,
          donationType,
          email,
          fullNames: name,
          transactionType: 'deposit',
        },
      });

      // Send a thank-you email
      const transporter = nodemailer.createTransport({
        host: 'smtp.ionos.com',
        port: 587,
        auth: {
          user: process.env.SENDER_EMAIL,
          pass: process.env.SENDER_EMAIL_PASSWORD,
        },
      });

      const message = {
        from: `"Gataama" <${process.env.SENDER_EMAIL}>`,
        to: transaction.email,
        subject: `Thank you for your Donation`,
        html: `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Receipt Gataama</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.2/css/bootstrap.min.css"
                integrity="sha512-CpIKUSyh9QX2+zSdfGP+eWLx23C8Dj9/XmHjZY2uDtfkdLGo0uY12jgcnkX9vXOgYajEKb/jiw67EYm+kBf+6g=="
                crossorigin="anonymous" referrerpolicy="no-referrer" />
              <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet" />
            </head>
            <body>
              <div class="container">
                <div class="row">
                  <div class="col">
                    <p>Dear ${transaction.fullNames}</p>
                    <p>I hope this message finds you well. On behalf of Gataama, I want to express our deepest gratitude for your generous donation of ${transaction.currency} ${transaction.amount} to support our cause.</p>
                    <p>Your contribution means more than words can express. With your support, we can continue our efforts to promote unity, empowerment, and progress across the African continent and its diaspora. Your belief in our mission is truly inspiring, and it reaffirms our commitment to making a positive impact in the lives of people throughout Africa and beyond.</p>
                    <p>Your donation will directly contribute to initiatives aimed at fostering social, economic, and political development, as well as promoting cultural exchange and solidarity among African communities worldwide.</p>
                    <p>Once again, thank you for your generosity and support. Together, we can work towards a brighter future for all Africans.</p>
                    <p>With heartfelt thanks,</p>
                    <br />
                    <p>Best,</p>
                    <h3>The Management of GATAAMA FOUNDATION.</h3>
                  </div>
                </div>
              </div>
            </body>
          </html>`,
      };

      await transporter.sendMail(message);

      console.log(`Email sent to ${transaction.email}`);
    } catch (error) {
      console.error('Error handling webhook event:', error.message);
    }
  }

  res.status(200).json({ received: true });
};

// Get available currencies
exports.getCurrencies = async (req, res) => {
  try {
    const currencies = await prisma.wallet.findMany({
      where: { status: 1 },
      orderBy: { currency: 'asc' },
    });

    res.status(200).send({ currencies });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: process.env.ERROR_MESSAGE });
  }
};

// Admin analytics
exports.getAdminAnalytics = async (req, res) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: {
        amount: { gt: 0 },
        status: 1,
      },
      orderBy: { currency: 'asc' },
    });

    const transactions = await prisma.transaction.findMany({
      where: { status: 'successful' },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 transactions
    });

    res.status(200).send({ wallets, transactions });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: process.env.ERROR_MESSAGE });
  }
};

