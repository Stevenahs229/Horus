# Horus

## Project: NELIAXA

Objective: Build an online investment platform that lets users invest and
receive a return on investment (ROI) of 4% to 7%.

This README captures the requirements from the provided project brief and
turns them into a structured scope for implementation.

## Stack (full stack)

- React + Vite (client)
- Express API (server)
- Tailwind CSS + Framer Motion for modern UI and animations
- SQLite database with JWT authentication

## Repository structure

- /client: React front-end
- /server: Node.js API

## Core functional requirements

1. Registration and authentication
   - Secure sign up and login
   - Two-factor authentication (2FA)
2. User dashboard
   - View and manage investments
   - Check balance and performance in real time
3. Investment options
   - Multiple investment types and categories
4. ROI calculator
   - Estimate ROI based on amount and duration
5. Security and trust
   - KYC identity verification
   - Deposit insurance / partial capital guarantee
   - Blockchain audit / proof of returns

## Advanced financial features

- Multi-placement portfolio diversification
- Automated recurring investment plans
- Detailed transaction history and performance charts
- ROI alerts and personalized notifications

## User experience and gamification

- Levels and badges for engagement
- Referral and rewards program
- Demo / simulator mode for risk-free testing

## Premium and exclusive features

- Early access to selected placements
- Personalized dashboard by investor profile
- Virtual AI advisor / financial analysis chat

## Community and social

- Community space / forum
- Votes on investment projects (crowdfunding style)
- Monthly surveys on market performance and feature choices

## Technical and practical requirements

- iOS and Android app with push notifications
- Multi-device and multi-language support
- Payment methods: card, mobile money, crypto, bank transfer

## UX requirements

- Simple, fluid, and pleasant interface
- Visual elements that help navigation

## MVP proposal (initial scope)

- Secure registration/login with 2FA
- Basic KYC flow
- User dashboard (balance, investments, performance)
- Limited set of investment products
- ROI calculator
- Transaction history
- Payments: card + bank transfer
- Notifications for key account events

## Next steps

1. Confirm tech stack and target platforms
2. Define data model and API contracts
3. Create UI/UX wireframes for MVP screens
4. Build backlog and milestones from MVP scope
5. Identify compliance and regulatory constraints

## Local development

### 1) API

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

API runs on http://localhost:4000 by default.

Default credentials (dev):

- Admin: admin@neliaxa.com / admin1234
- Demo: demo@neliaxa.com / demo1234

### 2) Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Client runs on http://localhost:5173 and reads the API base from
VITE_API_URL.

Quick API check:

- http://localhost:4000/ (API status)
- http://localhost:4000/api/health

## Available features (current build)

- Auth (register/login + JWT + optional 2FA)
- Multi-page dashboard (overview, portfolio, analytics, wallet, settings)
- Admin area (user list, roles, investment CRUD, wallet overview)
- Charts via Recharts (allocation + growth)
- SQLite database for users, positions, and performance snapshots
- Simulated wallet with deposit/withdraw flows

## Roles and permissions

- admin: full access
- manager: investments + metrics + read users + wallets
- support: read users + wallets
- user: standard dashboard access

> Note: role changes apply on next login (JWT is role-based).

## Two-factor authentication (2FA)

1. Login, then open **Settings**.
2. Click **Enable 2FA**, scan the QR code.
3. Enter the 6-digit code to confirm.

## Docker (optional)

```bash
docker compose up --build
```

- Client: http://localhost:4173
- API: http://localhost:4000

## CI

GitHub Actions runs a minimal build for client and server packages.