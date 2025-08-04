# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Database
```env
DATABASE_URL="your_database_connection_string"
```

### NextAuth
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"
```

### Email (for verification emails)
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your_email@gmail.com"
EMAIL_SERVER_PASSWORD="your_app_password"
EMAIL_FROM="noreply@yourdomain.com"
```

### OAuth Providers (Optional)
```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### AWS S3 (Optional - for avatar uploads)
```env
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your_s3_bucket_name"
```

### Stripe (Required for payments)
```env
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

## Stripe Setup

The application automatically creates:
- **Stripe Customer** for all users (for making payments)
- **Stripe Connect Account** for PRO users (for receiving payments)

### Test Mode
The current configuration uses Stripe test keys, which is perfect for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### Production Setup
For production, replace test keys with live keys from your Stripe dashboard.

## Avatar Upload Fallback

If S3 is not configured, the system will automatically fall back to local file storage in the `public/uploads/avatars/` directory. This works for development but is not recommended for production.

## Getting Started

1. Copy the variables above to your `.env.local` file
2. Fill in the required values
3. For S3 setup, create an AWS account and S3 bucket
4. For email setup, use Gmail with App Passwords or another SMTP provider
5. For Stripe setup, create a Stripe account and get your API keys

## Testing Registration

After setting up the environment variables:

1. Start the development server: `npm run dev`
2. Navigate to `/auth/register`
3. Test both user types (Client and Pro)
4. Test avatar upload functionality
5. Verify email verification works
6. Check that Stripe customers are created in your Stripe dashboard

## User Types and Stripe Integration

### CLIENT Users
- Get a Stripe Customer ID for making payments
- Can book artists and make payments
- Cannot receive payments

### PRO Users
- Get a Stripe Customer ID for making payments
- Get a Stripe Connect Account ID for receiving payments
- Can offer services and receive payments
- Need to complete Stripe Connect onboarding to receive payments

## Troubleshooting

### Avatar Upload Issues
- If S3 is not configured, files will be saved locally
- Check that the `public/uploads/avatars/` directory exists and is writable
- Ensure file size is under 5MB

### Email Issues
- Verify SMTP credentials are correct
- Check that the email provider allows SMTP access
- For Gmail, use App Passwords instead of regular passwords

### Database Issues
- Ensure the database is running and accessible
- Run `npx prisma db push` to sync the schema
- Run `npx prisma generate` to generate the client

### Stripe Issues
- Verify your Stripe keys are correct
- Check Stripe dashboard for any errors
- Ensure webhook endpoints are configured for production
- For Connect accounts, users need to complete onboarding 