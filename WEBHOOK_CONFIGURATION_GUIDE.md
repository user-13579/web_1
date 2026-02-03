# PayOS Webhook Configuration Guide

## 🔍 Understanding Webhook Status in PayOS

### No Status = Webhook Not Configured

If you see **no verified/not verified status** in PayOS dashboard, it means:
- ❌ Webhook URL is **not configured** in PayOS
- ❌ PayOS doesn't know where to send webhooks
- ❌ Payments will stay PENDING because PayOS can't confirm them

### After Configuration

Once you configure the webhook URL:
1. PayOS will send a **verification POST** to your webhook
2. Your webhook responds: `{ "message": "webhook setup success" }`
3. PayOS shows status: **"Đã xác thực"** (Verified)
4. PayOS will now send webhooks for all payments

## 🚀 How to Configure Webhook

### Method 1: Use PowerShell Script (Recommended)

Run the configuration script:

```powershell
.\configure-webhook.ps1
```

This will:
- Configure webhook URL in PayOS
- Trigger PayOS to verify your webhook
- Show you the result

### Method 2: Use Your Setup Endpoint

Call your setup endpoint:

```powershell
$body = '{"webhookUrl":"https://web-1-tawny.vercel.app/api/payos/webhook"}' | ConvertTo-Json
Invoke-WebRequest -Uri "https://web-1-tawny.vercel.app/api/payos/setup-webhook" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

### Method 3: Direct API Call

```powershell
$body = @{
    webhookUrl = "https://web-1-tawny.vercel.app/api/payos/webhook"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-client-id" = "663a8ff5-fd02-4271-9091-b9b383d59fac"
    "x-api-key" = "e2d26fcb-2951-48ec-987c-f06571e19d33"
}

Invoke-WebRequest -Uri "https://api-merchant.payos.vn/v2/payment-requests/webhook" -Method POST -Headers $headers -Body $body
```

### Method 4: Contact PayOS Support

If API calls fail due to network issues:

**Email:** support@payos.vn

**Subject:** Request to configure webhook URL

**Message:**
```
Hi PayOS Team,

Please configure my webhook URL:

Webhook URL: https://web-1-tawny.vercel.app/api/payos/webhook
Client ID: 663a8ff5-fd02-4271-9091-b9b383d59fac
Payment Channel: Bs Hoàng Hiệp

Thank you!
```

## ✅ After Configuration

### Step 1: Check PayOS Dashboard

1. Go to **PayOS Dashboard → Webhook settings** (or payment channel settings)
2. You should now see:
   - **Webhook URL:** `https://web-1-tawny.vercel.app/api/payos/webhook`
   - **Status:** "Đã xác thực" (Verified) or "Chưa xác thực" (Not verified)

### Step 2: Check Vercel Logs

1. Go to **Vercel Dashboard → Logs**
2. Look for: `📥 PayOS webhook received:`
3. This means PayOS sent a verification request

### Step 3: Verify Webhook Response

Your webhook should return:
```json
{
  "message": "webhook setup success"
}
```

If it does, PayOS will mark it as verified.

## 🔄 What Happens Next

1. **Webhook Configured** → PayOS knows your webhook URL
2. **Verification Request** → PayOS sends POST to verify it works
3. **Webhook Verified** → Status shows "Đã xác thực"
4. **Payment Webhooks** → PayOS sends webhooks for all payments
5. **Payments Confirmed** → Payments marked as PAID automatically

## 🐛 Troubleshooting

### Issue: Configuration Fails

**Check:**
- Are your `PAYOS_CLIENT_ID` and `PAYOS_API_KEY` correct?
- Can you access `api-merchant.payos.vn` from your network?
- Check error message in response

**Solution:**
- Try from different network (mobile hotspot)
- Contact PayOS support for manual configuration

### Issue: Webhook Not Verified After Configuration

**Check:**
- Is your webhook returning `{ "message": "webhook setup success" }`?
- Check Vercel logs for webhook requests
- Verify webhook is accessible (test with GET request)

**Solution:**
- Make sure webhook POST handler returns correct response
- Check Vercel deployment is live
- Wait a few minutes - verification can take time

### Issue: Still No Status After Configuration

**Check:**
- Did the API call return success (code: "00")?
- Check PayOS dashboard - webhook URL should appear
- Refresh the dashboard page

**Solution:**
- Wait 1-2 minutes for PayOS to update
- Check different section of PayOS dashboard
- Contact PayOS support if still not showing

## 📊 Status Reference

| Status | Meaning | Action |
|--------|---------|--------|
| **No Status** | Webhook not configured | Configure webhook URL |
| **Chưa xác thực** | Not verified | Wait for verification or check webhook response |
| **Đã xác thực** | Verified | Webhook is working! |

## 🎯 Quick Start

1. **Run configuration:**
   ```powershell
   .\configure-webhook.ps1
   ```

2. **Check result:**
   - Should see: "✅ Webhook configured successfully!"

3. **Verify in PayOS:**
   - Go to PayOS Dashboard
   - Check webhook settings
   - Should see your webhook URL

4. **Test with payment:**
   - Make a test payment
   - Check Vercel logs for webhook
   - Payment should be marked PAID

Your webhook endpoint is ready - you just need to configure it in PayOS!

