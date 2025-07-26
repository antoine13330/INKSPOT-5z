# Social Media Pro

A modern social media platform designed for professionals to showcase their work, connect with clients, and manage bookings with integrated payments.

## Features

- 🔐 Authentication (Email/Password, Google OAuth, Apple OAuth, Magic Links)
- 📱 Social media feed with posts, likes, comments
- 💬 Real-time messaging system
- 📅 Professional booking system
- 💳 Integrated payments with Stripe
- 🔔 Push notifications
- 📁 File uploads to AWS S3
- 🎨 Customizable professional profiles
- 🔍 Smart content recommendations
- 📊 Admin dashboard

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **File Storage**: AWS S3
- **Email**: Nodemailer
- **Push Notifications**: Web Push

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd social-media-pro
pnpm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

- **Database**: Set up a PostgreSQL database and update `DATABASE_URL`
- **NextAuth**: Generate a random secret for `NEXTAUTH_SECRET`
- **OAuth**: Configure Google and Apple OAuth credentials
- **Email**: Set up SMTP server credentials
- **Stripe**: Add your Stripe API keys
- **AWS S3**: Configure S3 bucket for file uploads
- **VAPID**: Generate keys for push notifications

### 3. Generate VAPID Keys

```bash
pnpm run generate-vapid
```

Copy the generated keys to your `.env` file.

### 4. Database Setup

```bash
# Push the schema to your database
pnpm run db:push

# Seed the database with sample data
pnpm run db:seed
```

### 5. Start Development Server

```bash
pnpm run dev
```

Visit `http://localhost:3000` to see the application.

## Default Users

After seeding, you can log in with:

- **Admin**: admin@example.com / admin123
- **Professional**: pierce@example.com / pro123

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Random 32+ character string |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | From Google Console |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `AWS_S3_BUCKET_NAME` | S3 bucket for uploads | `my-app-uploads` |

## Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run db:push` - Push schema to database
- `pnpm run db:studio` - Open Prisma Studio
- `pnpm run db:seed` - Seed database with sample data
- `pnpm run generate-vapid` - Generate VAPID keys

## License

MIT