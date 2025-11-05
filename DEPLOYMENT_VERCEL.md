# Vercel Deployment Guide

This guide will walk you through deploying your Next.js application to Vercel.

## Prerequisites

1. **GitHub/GitLab/Bitbucket Account**: Your code should be in a Git repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **Environment Variables**: Gather all your environment variables from `.env.local`

## Step 1: Prepare Your Repository

### 1.1 Commit Your Code
Make sure all your code is committed to Git:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Create `.gitignore` (if not exists)
Ensure `.env.local` is in `.gitignore` to avoid committing secrets:

```
.env.local
.env*.local
.next
node_modules
```

## Step 2: Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Sign in with GitHub, GitLab, or Bitbucket (recommended for easy integration)

## Step 3: Import Your Project

1. In your Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import your Git repository:
   - If connected, select your repository from the list
   - If not connected, click **"Import Git Repository"** and authorize Vercel
3. Select your repository and click **"Import"**

## Step 4: Configure Project Settings

### 4.1 Build Settings
Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `next build --webpack` (or leave as default)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (or `yarn install` / `pnpm install`)

### 4.2 Environment Variables
Click **"Environment Variables"** and add all required variables:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_... (for webhook verification)
```

#### VNPay Configuration
```
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html (sandbox)
# Or for production:
# VNPAY_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-domain.vercel.app/purchase/success
VNPAY_IPN_URL=https://your-domain.vercel.app/api/vnpay/callback
```

#### Other Variables (if needed)
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Important Notes:**
- Set variables for **Production**, **Preview**, and **Development** environments as needed
- Use **Production** values for live site
- Use **Test/Sandbox** values for preview deployments

### 4.3 Node.js Version
Vercel uses Node.js 20.x by default (recommended). If needed, create `package.json` engines:
```json
"engines": {
  "node": ">=20.0.0"
}
```

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Vercel will provide a deployment URL (e.g., `your-project.vercel.app`)

## Step 6: Configure Webhooks (Stripe)

### 6.1 Update Stripe Webhook URL
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - Any other events your app uses
4. Copy the **Webhook Signing Secret** and add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### 6.2 Update VNPay Callback URLs
1. Update `VNPAY_RETURN_URL` and `VNPAY_IPN_URL` in Vercel environment variables with your actual domain
2. Update these URLs in your VNPay merchant dashboard if required

## Step 7: Update Environment Variables with Production URLs

After deployment, update these variables in Vercel:
- `VNPAY_RETURN_URL=https://your-actual-domain.vercel.app/purchase/success`
- `VNPAY_IPN_URL=https://your-actual-domain.vercel.app/api/vnpay/callback`
- `NEXT_PUBLIC_APP_URL=https://your-actual-domain.vercel.app`

Then **redeploy** to apply changes.

## Step 8: Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `yourdomain.com`)
3. Follow DNS configuration instructions:
   - Add A record or CNAME record as instructed
   - Wait for DNS propagation (can take up to 24 hours)

## Step 9: Verify Deployment

### 9.1 Test the Site
- Visit your deployment URL
- Test authentication (login/signup)
- Test payment flows (use test mode for Stripe/VNPay)
- Check all pages load correctly

### 9.2 Check Build Logs
- Go to **Deployments** tab
- Click on your deployment
- Review **Build Logs** for any warnings or errors

### 9.3 Monitor Errors
- Check **Analytics** tab for performance
- Monitor **Functions** tab for API route errors

## Step 10: Continuous Deployment

Vercel automatically deploys on every push to your main branch:
- **Production**: Pushes to `main` or `master` branch
- **Preview**: Pushes to other branches (creates preview URLs)
- **Pull Requests**: Creates preview deployments for PRs

## Troubleshooting

### Build Fails
1. Check **Build Logs** in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies
   - Build command errors

### API Routes Not Working
1. Verify environment variables are set correctly
2. Check function logs in Vercel dashboard
3. Ensure API routes are in `app/api/` directory
4. Check CORS settings if needed

### Environment Variables Not Loading
1. Ensure variables are set for the correct environment (Production/Preview/Development)
2. Redeploy after adding new variables
3. Restart the deployment if needed

### Firebase Errors
1. Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
2. Check Firebase project settings
3. Ensure Firebase Auth domains include your Vercel domain

### Stripe Webhook Not Working
1. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
2. Check webhook URL in Stripe dashboard matches your Vercel domain
3. Review webhook logs in Stripe dashboard

### VNPay Payment Issues
1. Verify VNPay credentials are correct
2. Check callback URLs are accessible
3. Ensure VNPay merchant account is configured for your domain

## Quick Reference Commands

### Manual Deployment (via CLI)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Check Environment Variables
```bash
vercel env ls
```

### Add Environment Variable via CLI
```bash
vercel env add VARIABLE_NAME
```

## Security Checklist

- [ ] All `.env.local` files are in `.gitignore`
- [ ] Production secrets are not in code
- [ ] Environment variables are set in Vercel
- [ ] Stripe keys are production keys (not test keys in production)
- [ ] Firebase Auth domains include your Vercel domain
- [ ] Webhook secrets are secure
- [ ] HTTPS is enabled (automatic on Vercel)

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

---

**Next Steps After Deployment:**
1. Test all user flows
2. Set up monitoring/analytics
3. Configure custom domain (if desired)
4. Set up staging environment
5. Enable error tracking (e.g., Sentry)

