# UnlockMedia — Pay-to-Unlock Digital Media Platform

A complete, functional, production-oriented photo and video unlocking platform built with **React**, **Express.js**, **MongoDB**, and **Razorpay Standard Checkout**.

Allows anyone to browse 8K master photography and 4K cinema video previews and purchase instant uncompressed access to individual media items for **₹99 each** with **zero account registration, login, or subscriptions**.

---

## 🌟 Key Architecture & Features

- **No Login / No Signup Required**:
  - Anonymous visitor browsing with cryptographic entitlement verification.
  - Generates high-entropy purchase access tokens (64-character hex) and formatted human-readable recovery codes (`UNLK-XXXX-XXXX-XXXX`).
  - Access is saved in the visitor's local browser storage (`localStorage`) and restorable from any device via the Recovery portal.
- **₹99 Individual Media Model**:
  - Each locked photo or video costs ₹99 by default.
  - Purchases grant access strictly to the single purchased asset (does not unlock others).
- **Protected Media Delivery**:
  - Public gallery never exposes original high-resolution master URLs or storage keys.
  - Previews feature limited watermarked overlays and low-bandwidth preview video clips.
  - When payment is verified, the server issues a short-lived HMAC-SHA256 signed streaming token.
  - Video streaming supports HTTP Range requests (RFC 7233) for seeking and scrubbing.
- **Razorpay Integration Security**:
  - Authoritative server-side pricing from MongoDB (never trusts client amounts).
  - Cryptographic HMAC-SHA256 payment signature verification using `RAZORPAY_KEY_SECRET`.
  - Idempotent order processing and webhook handling (`payment.captured`, `order.paid`, `payment.failed`).
  - Seamless development test simulator mode if API keys are in demo test mode.
- **14 Built Pages**:
  1. **Home**: Hero section, ₹99 pricing callouts, search, category filter, media cards, how-it-works.
  2. **All Photos**: Master photography gallery (8K RAW masters) with category filters and sorting.
  3. **All Videos**: 4K 60FPS cinema video reels with duration badges and preview clips.
  4. **Media Details & Preview**: Watermarked preview, asset specs, "Unlock for ₹99", and protected viewer.
  5. **Payment Success**: Confetti celebration, order ref, payment ID, and prominent Recovery Code card.
  6. **Payment Failure / Cancellation**: Clear diagnosis and bank debit reversal explanations.
  7. **Purchase Access & Recovery**: Restore media access by code or payment ID, plus browser library viewer.
  8. **About**: Platform story, creator curation standards, transparent ₹99 pricing model.
  9. **Privacy Policy**: DPDP Act compliance, Razorpay data handling, technical logs, zero cross-site trackers.
  10. **Terms & Conditions**: Digital goods licensing, non-redistribution, ₹99 terms, Bengaluru jurisdiction.
  11. **Refund & Cancellation Policy**: Failed payments, duplicate charge reversals (5-7 business days).
  12. **Contact & Support**: Working inquiry submission form, studio phone, email, and address.
  13. **Copyright & Ownership**: Notice and takedown protocol (DMCA & Indian Copyright Act 1957).
  14. **Protected Admin Dashboard**: JWT admin login, revenue stats, catalog management, file uploads, orders, and inquiries.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Canvas Confetti, React Router DOM |
| **Backend** | Node.js, Express.js, Mongoose, Multer, Helmet, Morgan, Express-Rate-Limit, Razorpay SDK |
| **Database** | MongoDB (Local in dev, MongoDB Atlas in production) |
| **Storage** | Local disk storage with Range streaming (or private AWS S3 / Cloudflare R2 bucket) |
| **Payment Gateway** | Razorpay Standard Checkout (UPI, Cards, Netbanking) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ and npm installed
- MongoDB installed and running (default: `mongodb://127.0.0.1:27017`)

### 1. Clone & Install Dependencies

```bash
# In the project root:
npm run install:all
```

### 2. Configure Environment

Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Ensure `backend/.env` has:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pay_unlock_db
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
RAZORPAY_KEY_ID=rzp_test_SampleKeyId1234
RAZORPAY_KEY_SECRET=SampleSecretKey5678
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
```

### 3. Seed Database with Initial Media Catalog

```bash
npm run seed
```
*Seeds 8 sample 8K master photos and 4K cinema videos with ₹99 default pricing, and creates the default admin user.*

### 4. Run Development Servers

Run backend and frontend concurrently:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 💳 Razorpay Configuration & Test Mode

### Step 1: Getting Razorpay Test Keys
1. Create a free account at [https://dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Toggle to **Test Mode** (switch in top bar).
3. Navigate to **Account & Settings** > **API Keys** > **Generate Key**.
4. Copy `Key Id` (`rzp_test_...`) and `Key Secret`.
5. Paste them into `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YourKeyHere
   RAZORPAY_KEY_SECRET=YourSecretHere
   ```

### Step 2: Configuring Webhooks
1. In Razorpay Dashboard, navigate to **Account & Settings** > **Webhooks** > **Add New Webhook**.
2. **Webhook URL**: `https://<your-backend-domain>/api/payments/webhook`
3. **Secret**: Enter a secret and add it to `backend/.env` as `RAZORPAY_WEBHOOK_SECRET`.
4. **Events to Subscribe**:
   - `payment.captured`
   - `order.paid`
   - `payment.failed`

### Step 3: Moving to Production Live Mode
1. Complete KYC verification on Razorpay Dashboard.
2. Toggle from **Test Mode** to **Live Mode**.
3. Generate **Live API Keys** (`rzp_live_...`).
4. Update Render / Backend environment variables with live keys and live webhook secret.

---

## 🔒 Production Security Checklist

- [x] **No Account Registration Leaks**: Entitlements are anonymous and bound to cryptographic tokens and recovery codes.
- [x] **Authoritative Server Pricing**: Client never sends or controls the amount; price is fetched from MongoDB.
- [x] **Cryptographic Verification**: Razorpay payment signature HMAC is verified on server before granting access.
- [x] **Private Storage Protection**: Master files stored in private directory/bucket; never served as static public URLs.
- [x] **Signed Media Streaming**: Master stream URL uses HMAC-SHA256 signature that expires in 10 minutes.
- [x] **HTTP Range Streaming**: Video scrubbing and partial downloads handled securely with RFC 7233 byte ranges.
- [x] **Helmet Security Headers**: Strict CSP, frameguard, and referrer policy enabled.
- [x] **Rate Limiting**: Rate limiters placed on checkout orders, recovery lookups, contact messages, and admin login.
- [x] **Raw Webhook Parser**: Exact HMAC validation against unmodified buffer body.

---

## ☁️ Deployment Guide

### Frontend Deployment (Vercel)
1. Push project to GitHub.
2. Import repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_API_URL`: `https://<your-backend-render-app>.onrender.com`

### Backend Deployment (Render)
1. In [Render](https://render.com), create a **New Web Service**.
2. Set **Root Directory** to `backend`.
3. Build Command: `npm install`
4. Start Command: `node src/server.js`
5. Add Environment Variables from `.env.example`:
   - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://...`)
   - `FRONTEND_URL`: Your Vercel frontend URL (`https://your-app.vercel.app`)
   - `RAZORPAY_KEY_ID`: `rzp_live_...` or `rzp_test_...`
   - `RAZORPAY_KEY_SECRET`: Razorpay Secret
   - `JWT_SECRET`: Random 32+ character string
   - `ADMIN_EMAIL`: Admin email
   - `ADMIN_PASSWORD`: Admin password

### Database (MongoDB Atlas)
1. Create a free M0 cluster at [https://cloud.mongodb.com](https://cloud.mongodb.com).
2. Create database user with Read/Write access.
3. Allow Network Access from anywhere (`0.0.0.0/0`).
4. Copy connection string and configure `MONGODB_URI`.

---

## 🔑 Default Admin Credentials

- **Email**: `admin@unlockmedia.com`
- **Password**: `AdminSecurePass123!`
- **Portal URL**: `/admin/login`
- **Capabilities**: Upload new media, view revenue stats, review orders, process refunds, and view customer support tickets.
