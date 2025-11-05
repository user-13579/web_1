# VNPay QR Payment Integration Guide

This document explains how to integrate the actual VNPay API into the payment system.

## Overview

The VNPay payment system has been set up with placeholder functions that need to be replaced with actual VNPay API calls. The infrastructure is ready, and you just need to plug in the VNPay API endpoints.

## Files That Need VNPay API Integration

### 1. `/app/api/checkout/vnpay/route.ts`

This is the main checkout endpoint that creates VNPay payment sessions. You need to:

- Replace the placeholder with actual VNPay API call to create payment URL
- Add VNPay configuration (TMN Code, Secret Key, etc.)
- Implement signature generation for VNPay requests

**Key areas to update:**
- Line ~40-50: Replace placeholder with actual `createVNPayPayment()` function
- Add VNPay environment variables:
  - `VNPAY_TMN_CODE`
  - `VNPAY_SECRET_KEY`
  - `VNPAY_URL` (VNPay API endpoint)

### 2. `/app/api/vnpay/callback/route.ts`

This handles VNPay payment callbacks and IPN (Instant Payment Notification).

**Key areas to update:**
- Line ~20: Implement `verifyVNPaySignature()` to verify callback signatures
- Line ~60: Implement `verifyVNPayIPNSignature()` for IPN verification
- Line ~65: Add database update logic to mark payments as completed
- Line ~66: Call function to grant user access after successful payment

### 3. `/app/purchase/vnpay/page.tsx`

This displays the VNPay QR code to users.

**Key areas to update:**
- Line ~40: Replace placeholder with actual API call to fetch VNPay QR code
- The QR code should be fetched from VNPay API response

## VNPay API Integration Steps

### Step 1: Configure Environment Variables

Add these to your `.env.local`:

```env
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/vnpay/callback
VNPAY_IPN_URL=http://localhost:3000/api/vnpay/callback
```

### Step 2: Install VNPay SDK (if needed)

```bash
npm install vnpay
# or
npm install @vnpay/vnpay-sdk
```

### Step 3: Implement VNPay Payment Creation

In `/app/api/checkout/vnpay/route.ts`, replace the placeholder with:

```typescript
import VNPay from 'vnpay'; // or your VNPay SDK

async function createVNPayPayment(params: {
  amount: number;
  orderId: string;
  orderDescription: string;
  returnUrl: string;
  ipnUrl: string;
}) {
  const vnpay = new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE!,
    secretKey: process.env.VNPAY_SECRET_KEY!,
    url: process.env.VNPAY_URL!,
  });

  const paymentUrl = await vnpay.buildPaymentUrl({
    amount: params.amount,
    orderId: params.orderId,
    orderDescription: params.orderDescription,
    returnUrl: params.returnUrl,
    ipnUrl: params.ipnUrl,
    // Add other required VNPay parameters
  });

  return paymentUrl;
}
```

### Step 4: Implement Signature Verification

In `/app/api/vnpay/callback/route.ts`:

```typescript
function verifyVNPaySignature(params: URLSearchParams): boolean {
  const vnp_SecureHash = params.get('vnp_SecureHash');
  // Remove hash from params for verification
  const paramsToVerify = new URLSearchParams(params);
  paramsToVerify.delete('vnp_SecureHash');
  
  // Sort params and create query string
  const sortedParams = Array.from(paramsToVerify.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // Create hash
  const secretKey = process.env.VNPAY_SECRET_KEY!;
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(sortedParams)
    .digest('hex');
  
  return hash === vnp_SecureHash;
}
```

### Step 5: Update Payment Status

After verifying payment, update the database and grant access:

```typescript
// In callback handler
if (isSuccess) {
  // Update payment record in database
  await updatePaymentStatus(transactionId, 'completed');
  
  // Grant user access
  const { uid, product, courseId, packageId } = getPaymentDetails(transactionId);
  await grantUserAccess(uid, product, courseId, packageId);
}
```

## Payment Flow

1. **User clicks "VNPay QR" button**
   - Calls `/api/checkout/vnpay` with product details
   - Returns VNPay payment URL

2. **User redirected to VNPay payment page**
   - Shows QR code or payment form
   - User completes payment

3. **VNPay redirects to callback**
   - VNPay calls `/api/vnpay/callback` with payment result
   - Verify signature and update payment status
   - Redirect user to success/failure page

4. **IPN notification (optional)**
   - VNPay sends POST to `/api/vnpay/callback` (IPN)
   - Verify and update payment status in background

5. **User sees success page**
   - `/purchase/success` grants access automatically

## Testing

1. Use VNPay sandbox/test environment first
2. Test with small amounts
3. Verify callback handling works correctly
4. Test IPN notifications
5. Verify user access is granted after payment

## Support

When you have the VNPay API documentation, replace the placeholder functions with actual implementations following the patterns above.

