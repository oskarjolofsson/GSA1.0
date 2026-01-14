# Project Setup Guide

This document describes the required environment variables and the basic steps needed to run the application locally.

---

## Folder Scope

This directory contains the frontend service and its local runtime configuration. It is responsible for:

- Frontend application startup
- Firebase authentication integration
- Stripe payment integration
- API communication with the backend

---

## Prerequisites

The following tools are required to run this service locally:

- Node.js (latest LTS version recommended)
- npm package manager

---

## Environment Variables

All environment variables must be defined before starting the application. A `.env.local` file is recommended.

### Backend API

```
VITE_API_URL=http://localhost:8000
```

### Firebase Configuration (Frontend)

Firebase configuration for authentication and data integration.

```env
VITE_FIREBASE_API_KEY_TS=
VITE_FIREBASE_AUTH_DOMAIN_TS=
VITE_FIREBASE_PROJECT_ID_TS=
VITE_FIREBASE_STORRAGE_BUCKET_TS=
VITE_FIREBASE_MESSAGING_SENDER_ID_TS=
VITE_FIREBASE_APP_ID_TS=
VITE_FIREBASE_MEASUREMENT_ID_TS=
```

---

### Stripe Configuration

Used for payments and subscriptions.

```env
VITE_PRICE_ID_PLAYER_MONTHLY=
VITE_PRICE_ID_PLAYER_YEARLY=
VITE_PRICE_ID_PRO_MONTHLY=
VITE_PRICE_ID_PRO_YEARLY=
```

---

## Local Development Setup

Follow these steps to run the application locally:

1. Define all required environment variables (preferably in a `.env.local` file).
2. Install all required dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

---

## Verification

After starting the application, verify that the frontend is running:

- The service should start without errors
- The frontend should be accessible at `http://localhost:5173`

---

## Notes

* Ensure you are using a compatible Node.js version for the frontend.
* Do not commit `.env.local` files or API keys to version control.
* The frontend requires the backend API to be running for full functionality.

