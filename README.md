# Stripe Marketplace

A full-stack marketplace application powered by Stripe Connect, enabling multi-vendor selling with product listings, onboarding, and checkout — no custom database required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Express.js 5, TypeScript |
| Payments | Stripe SDK (Connect, Checkout, Webhooks) |

## Features

- Seller onboarding via Stripe Connect (hosted KYC flow)
- Product creation and listing per seller account
- Stripe Checkout for one-time purchases and subscriptions
- Webhook handling for payment lifecycle events
- 10% platform fee on subscriptions, fixed fee on one-time payments

## Project Structure

```
marketplace/
├── client/        # Next.js frontend
└── server/        # Express.js backend
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Stripe account](https://dashboard.stripe.com/register)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhook testing)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd marketplace
```

### 2. Set up the server

```bash
cd server
cp .env.example .env
# Fill in your Stripe keys in .env
npm install
npm run dev
```

### 3. Set up the client

```bash
cd client
cp .env.example .env.local
# Fill in values in .env.local if needed
npm install
npm run dev
```

### 4. Forward Stripe webhooks (local development)

```bash
stripe listen --forward-to localhost:4242/webhook
```

Copy the webhook signing secret printed by the CLI and paste it as `WEBHOOK_SECRET` in `server/.env`.

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `DOMAIN` | Frontend URL (default: `http://localhost:3000`) |
| `WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |

### Client (`client/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default: `http://localhost:4242`) |

## Available Scripts

### Server

```bash
npm run dev    # Start with ts-node (development)
npm run build  # Compile TypeScript to dist/
npm start      # Run compiled output
```

### Client

```bash
npm run dev    # Start Next.js dev server on :3000
npm run build  # Production build
npm start      # Start production server
npm run lint   # Run ESLint
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook` | Stripe webhook receiver |
| POST | `/create-connect-account` | Create a seller's Connected Account |
| POST | `/create-account-link` | Generate Stripe-hosted onboarding URL |
| GET | `/account-status/:accountId` | Check seller verification status |
| POST | `/create-product` | Create a product on seller's account |
| GET | `/products/:accountId` | List all products for a seller |
| POST | `/create-checkout-session` | Initiate Stripe Checkout |

## License

MIT
