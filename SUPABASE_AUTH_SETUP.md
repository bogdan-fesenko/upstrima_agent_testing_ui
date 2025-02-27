# Setting Up Supabase Authentication

This guide will help you set up Supabase authentication for the AI Agent Platform.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Access to the Supabase dashboard

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project
3. Choose a name for your project and set a secure database password
4. Choose a region close to your users
5. Wait for your project to be created (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to the project dashboard
2. Click on the "Settings" icon in the left sidebar
3. Click on "API" in the settings menu
4. You will find your project URL and anon/public key on this page
5. Copy these values as you will need them for the next step

## Step 3: Configure Your Environment Variables

1. Open the `.env.local` file in the root of the web-ui directory
2. Update the Supabase configuration with your project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Enable Google OAuth (Optional)

To enable Google Sign-In:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Configure the OAuth consent screen if prompted
6. For application type, select "Web application"
7. Add your authorized JavaScript origins:
   - For local development: `http://localhost:3000`
   - For production: Your production URL
8. Add your authorized redirect URIs:
   - For local development: `http://localhost:3000/auth/callback`
   - For production: `https://your-production-domain.com/auth/callback`
9. Click "Create" and note your Client ID and Client Secret

Then, in your Supabase dashboard:

1. Go to "Authentication" > "Providers"
2. Find "Google" in the list and enable it
3. Enter your Google Client ID and Client Secret
4. Save the changes

## Step 5: Configure Email Templates (Optional)

You can customize the email templates that Supabase sends for:

1. Confirmation emails
2. Invitation emails
3. Magic link emails
4. Reset password emails

To do this:

1. Go to "Authentication" > "Email Templates" in your Supabase dashboard
2. Customize the templates as needed
3. Save your changes

## Step 6: Test Authentication

1. Start your Next.js development server:
   ```
   npm run dev
   ```
2. Navigate to the login page at `http://localhost:3000/login`
3. Try signing up with email and password
4. Try signing in with Google (if configured)

## Troubleshooting

- **CORS errors**: Make sure your site URL is added to the allowed origins in Supabase
- **Redirect issues**: Verify that your redirect URLs are correctly configured
- **Email not arriving**: Check your spam folder and verify your email templates

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication Documentation](https://nextjs.org/docs/authentication)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)