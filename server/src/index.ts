import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

app.use(cors({ origin: process.env.DOMAIN }));
app.use(express.static('public'));

// IMPORTANT: Register this BEFORE app.use(express.json())
app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    let event: Stripe.Event = JSON.parse(req.body.toString()); // If you have an endpoint secret, verify the
    // signature for security
    const endpointSecret = process.env.WEBHOOK_SECRET;
    if (endpointSecret) {
      const signature = req.headers['stripe-signature'] as string;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret) as Stripe.Event;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.log('Webhook signature verification failed:', message);
        res.sendStatus(400);
        return;
      }
    } // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment successful for session:', session.id); // Fulfill the order: send email, grant access,
        // update your records, and so on
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Session expired:', session.id); // Optionally notify the customer or clean up
        // any pending records
        break;
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Delayed payment succeeded for session:', session.id); // Fulfill the order now that payment cleared
        break;
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment failed for session:', session.id); // Notify the customer that payment failed
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', subscription.id); // Revoke access for the customer
        break;
      }
      default:
        console.log('Unhandled event type:', event.type);
    }
    res.send();
  },
);

// JSON and URL-encoded parsers (AFTER webhook route)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Type definitions for request bodies
interface CreateAccountBody {
  email: string;
}
interface AccountIdBody {
  accountId: string;
}

// Create a Connected Account using Stripe V2 API
router.post(
  '/create-connect-account',
  async (req: Request<{}, {}, CreateAccountBody>, res: Response) => {
    try {
      const account = await stripe.v2.core.accounts.create({
        display_name: req.body.email,
        contact_email: req.body.email,
        dashboard: 'full',
        defaults: {
          responsibilities: {
            fees_collector: 'stripe',
            losses_collector: 'stripe',
          },
        },
        identity: {
          country: 'GB',
          entity_type: 'company',
        },
        configuration: {
          customer: {},
          merchant: {
            capabilities: {
              card_payments: { requested: true },
            },
          },
        },
      });
      res.json({ accountId: account.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  },
);

// Create Account Link for onboarding
router.post('/create-account-link', async (req: Request<{}, {}, AccountIdBody>, res: Response) => {
  const { accountId } = req.body;
  try {
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['merchant', 'customer'],
          refresh_url: `${process.env.DOMAIN}`,
          return_url: `${process.env.DOMAIN}?accountId=${accountId}`,
        },
      },
    });
    res.json({ url: accountLink.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Get Connected Account Status
router.get(
  '/account-status/:accountId',
  async (req: Request<{ accountId: string }>, res: Response) => {
    try {
      const account = await stripe.v2.core.accounts.retrieve(req.params.accountId, {
        include: ['requirements', 'configuration.merchant'],
      });
      const payoutsEnabled =
        account.configuration?.merchant?.capabilities?.stripe_balance?.payouts?.status === 'active';
      const chargesEnabled =
        account.configuration?.merchant?.capabilities?.card_payments?.status === 'active';
      const summaryStatus = account.requirements?.summary?.minimum_deadline?.status;
      const detailsSubmitted = !summaryStatus || summaryStatus === 'eventually_due';
      res.json({
        id: account.id,
        payoutsEnabled,
        chargesEnabled,
        detailsSubmitted,
        requirements: account.requirements?.entries,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  },
);

// Type definition for product creation
interface CreateProductBody {
  productName: string;
  productDescription: string;
  productPrice: number;
  accountId: string;
}
// Create a product on the connected account
router.post('/create-product', async (req: Request<{}, {}, CreateProductBody>, res: Response) => {
  const { productName, productDescription, productPrice, accountId } = req.body;
  try {
    // Create the product on the connected account
    const product = await stripe.products.create(
      {
        name: productName,
        description: productDescription,
      },
      { stripeAccount: accountId },
    ); // Create a price for the product
    const price = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: productPrice,
        currency: 'usd',
      },
      { stripeAccount: accountId },
    );
    res.json({
      productName,
      productDescription,
      productPrice,
      priceId: price.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Fetch products for a specific account
router.get('/products/:accountId', async (req: Request<{ accountId: string }>, res: Response) => {
  const { accountId } = req.params;
  try {
    const options: Stripe.RequestOptions = {};
    if (accountId !== 'platform') {
      options.stripeAccount = accountId;
    }
    const prices = await stripe.prices.list(
      {
        expand: ['data.product'],
        active: true,
        limit: 100,
      },
      options,
    );
    const products = prices.data.map((price) => {
      const product = price.product as Stripe.Product;
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: price.unit_amount,
        priceId: price.id,
        period: price.recurring ? price.recurring.interval : null,
      };
    });
    res.json(products);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Type definition for checkout
interface CheckoutBody {
  priceId: string;
  accountId: string;
}
// Create checkout session
router.post(
  '/create-checkout-session',
  async (req: Request<{}, {}, CheckoutBody>, res: Response) => {
    const { priceId, accountId } = req.body;
    try {
      // Retrieve the price to determine if it is
      // one-time or recurring
      const price = await stripe.prices.retrieve(priceId, { stripeAccount: accountId });
      const isSubscription = price.type === 'recurring';
      const mode = isSubscription ? 'subscription' : 'payment';
      const session = await stripe.checkout.sessions.create(
        {
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode,
          success_url: `${process.env.DOMAIN}/done?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.DOMAIN}`,
          ...(isSubscription
            ? {
                subscription_data: {
                  application_fee_percent: 10,
                },
              }
            : {
                payment_intent_data: {
                  application_fee_amount: 123,
                },
              }),
        },
        { stripeAccount: accountId },
      );
      res.redirect(303, session.url as string);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  },
);

// Mount all routes under /api
app.use('/api', router);
const PORT: number = parseInt(process.env.PORT || '4242', 10);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
