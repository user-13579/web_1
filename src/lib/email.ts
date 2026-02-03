/**
 * Email service for sending purchase confirmation emails
 * Uses SMTP via nodemailer or can be extended to use other services
 */

interface PurchaseEmailData {
	email: string;
	product: string;
	productName: string;
	orderCode?: string | number;
	amount?: number;
	courseId?: string;
	packageId?: string;
}

/**
 * Get product display name
 */
function getProductName(product: string, courseId?: string, packageId?: string): string {
	switch (product) {
		case 'meals':
			return 'Meals Library';
		case 'course':
			return courseId ? `Course ${courseId.toUpperCase()}` : 'Course Access';
		case 'mentor':
			return packageId ? `Mentor Package ${packageId}` : 'Mentor Package';
		default:
			return 'Product';
	}
}

/**
 * Format amount with currency
 */
function formatAmount(amount?: number): string {
	if (!amount) return '';
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
	}).format(amount);
}

/**
 * Generate HTML email template for purchase confirmation
 */
function generatePurchaseEmailHTML(data: PurchaseEmailData): string {
	const { productName, orderCode, amount } = data;
	const formattedAmount = formatAmount(amount);

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Purchase Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #C89A4B 0%, #B47A2A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
		<h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Purchase!</h1>
	</div>
	
	<div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
		<p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
		
		<p style="font-size: 16px; margin-bottom: 20px;">
			We're excited to confirm that your purchase has been successfully processed!
		</p>
		
		<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C89A4B;">
			<h2 style="color: #3E2510; margin-top: 0; font-size: 20px;">Purchase Details</h2>
			<p style="margin: 10px 0;"><strong>Product:</strong> ${productName}</p>
			${orderCode ? `<p style="margin: 10px 0;"><strong>Order Code:</strong> ${orderCode}</p>` : ''}
			${formattedAmount ? `<p style="margin: 10px 0;"><strong>Amount:</strong> ${formattedAmount}</p>` : ''}
		</div>
		
		<p style="font-size: 16px; margin-bottom: 20px;">
			Your account has been updated with access to <strong>${productName}</strong>. You can now log in to your account to start using your purchase.
		</p>
		
		<div style="text-align: center; margin: 30px 0;">
			<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/account" 
			   style="display: inline-block; background: linear-gradient(135deg, #C89A4B 0%, #B47A2A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
				Access Your Account
			</a>
		</div>
		
		<p style="font-size: 14px; color: #666; margin-top: 30px;">
			If you have any questions or need assistance, please don't hesitate to contact us.
		</p>
		
		<p style="font-size: 14px; color: #666; margin-top: 20px;">
			Best regards,<br>
			The Team
		</p>
	</div>
</body>
</html>
	`.trim();
}

/**
 * Generate plain text email for purchase confirmation
 */
function generatePurchaseEmailText(data: PurchaseEmailData): string {
	const { productName, orderCode, amount } = data;
	const formattedAmount = formatAmount(amount);

	return `
Thank You for Your Purchase!

Hello,

We're excited to confirm that your purchase has been successfully processed!

Purchase Details:
- Product: ${productName}
${orderCode ? `- Order Code: ${orderCode}\n` : ''}${formattedAmount ? `- Amount: ${formattedAmount}\n` : ''}

Your account has been updated with access to ${productName}. You can now log in to your account to start using your purchase.

Visit your account: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'}/account

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
The Team
	`.trim();
}

/**
 * Send purchase confirmation email
 * This function can be extended to use different email services
 */
export async function sendPurchaseConfirmationEmail(data: PurchaseEmailData): Promise<void> {
	const { email, product, courseId, packageId } = data;
	
	// Skip if email is not provided
	if (!email) {
		console.warn('⚠️ Cannot send purchase email: no email address provided');
		return;
	}

	const productName = getProductName(product, courseId, packageId);
	const emailData = {
		...data,
		productName,
	};

	const html = generatePurchaseEmailHTML(emailData);
	const text = generatePurchaseEmailText(emailData);

	// Try to send via API route (recommended approach)
	try {
		const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: email,
				subject: `Purchase Confirmation - ${productName}`,
				html,
				text,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Email API returned ${response.status}: ${errorText}`);
		}

		console.log(`✅ Purchase confirmation email sent to ${email} for ${productName}`);
	} catch (error: any) {
		console.error('❌ Failed to send purchase confirmation email:', error);
		// Don't throw - email failure shouldn't break the purchase flow
		// Log the error but continue processing
	}
}

