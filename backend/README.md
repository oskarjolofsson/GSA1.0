# Project Setup Guide

This document describes the required environment variables and the basic steps needed to run the application locally.

---

## Folder Scope

This directory contains the backend service and its local runtime configuration. It is responsible for:

- Backend application startup
- API integrations (OpenAI, Firebase, Stripe, Gemini)
- Object storage access via Cloudflare R2

---

## Prerequisites

The following tools are required to run this service locally:

- Python 3.10 or newer
- pip package manager

---

## Environment Variables

All environment variables must be defined before starting the application. A `.env` file is recommended.

### Application URLs

These variables define the URLs used by the frontend and backend during local development.

```env
VITE_API_URL=http://localhost:5173
VITE_API_URL2=http://127.0.0.1:5173
APP_URL=http://localhost:8000
```

---

### OpenAI Configuration

Used for OpenAI-powered features.

```env
OPENAI_API_KEY=
```

---

### Firebase Configuration (Backend)

Service account credentials for Firebase. These values are typically provided via a Firebase service account JSON file.

```env
FLASK_FIREBASE_PROJECT_ID=
FLASK_FIREBASE_PRIVATE_KEY_ID=
FLASK_FIREBASE_PRIVATE_KEY=
FLASK_FIREBASE_CLIENT_EMAIL=
FLASK_FIREBASE_CLIENT_ID=
FLASK_FIREBASE_CLIENT_CERT_URL=
```

> Note: `FLASK_FIREBASE_PRIVATE_KEY` must preserve line breaks. When stored in a `.env` file, this usually requires replacing actual newlines with `\n`.

---

### Stripe Configuration

Used for payments and subscriptions.

```env
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

#### Stripe Price IDs

Price IDs configured in the Stripe dashboard for each subscription tier.

```env
PRICE_ID_PLAYER_MONTHLY=
PRICE_ID_PLAYER_YEARLY=
PRICE_ID_PRO_MONTHLY=
PRICE_ID_PRO_YEARLY=
```

---

### Gemini API

Used for Gemini-related integrations.

```env
GEMINI_API_KEY=
```

---

### Cloudflare R2 Configuration

Used for object storage via Cloudflare R2 (S3-compatible API).

```env
S3_API=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
```

---

## Local Development Setup

Follow these steps to run the application locally:

1. Define all required environment variables (preferably in a `.env` file).
2. Install all required dependencies `pip install -r requirements.txt`
3. Navigate to the backend directory:

   ```bash
   cd backend
   ```
4. Start the backend application:

   ```bash
   python app.py
   ```

---

## Verification
After starting the application, verify that the backend is running:

- The service should start without errors
- The backend should be accessible at `http://localhost:8000`

---

## Notes

* Ensure you are using a compatible Python version for the backend.
* Stripe webhooks require a publicly accessible URL or a tunneling solution (e.g., during local development).
* Do not commit `.env` files or secret keys to version control.
