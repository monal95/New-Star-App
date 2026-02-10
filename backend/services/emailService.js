const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

if (!apiKey) {
    console.error('⚠️ WARNING: SENDGRID_API_KEY is not set in .env file');
}

if (!fromEmail) {
    console.error('⚠️ WARNING: SENDGRID_FROM_EMAIL is not set in .env file');
}

sgMail.setApiKey(apiKey);

// Email templates for different order statuses
const emailTemplates = {
    'Pending': {
        subject: 'Order Confirmed - Your Tailoring Order Has Been Received',
        getBody: (orderData) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { padding: 20px; }
                    .order-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                    .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Confirmed!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${orderData.name},</p>
                        <p>Thank you for placing your order with us. Your tailoring order has been successfully received and is now in our system.</p>
                        
                        <div class="order-details">
                            <h3>Order Details:</h3>
                            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                            <p><strong>Status:</strong> Order Received</p>
                            <p><strong>Number of Sets:</strong> ${orderData.noOfSets}</p>
                            <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
                            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
                        </div>
                        
                        <p>We will notify you as soon as your order moves to the next stage. If you have any questions, please don't hesitate to contact us.</p>
                        <p>Best regards,<br/><strong>New Star Tailors</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    },
    'In Progress': {
        subject: 'Your Order is Now in Progress - Update on Your Tailoring Order',
        getBody: (orderData) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { padding: 20px; }
                    .order-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
                    .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order in Progress</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${orderData.name},</p>
                        <p>Great news! Your tailoring order is now in progress. Our skilled tailors are working on your order with utmost care and precision.</p>
                        
                        <div class="order-details">
                            <h3>Order Details:</h3>
                            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                            <p><strong>Status:</strong> In Progress</p>
                            <p><strong>Number of Sets:</strong> ${orderData.noOfSets}</p>
                            <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
                        </div>
                        
                        <p>We will keep you updated throughout the process. Thank you for your patience!</p>
                        <p>Best regards,<br/><strong>New Star Tailors</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    },
    'Completed': {
        subject: 'Your Order is Ready! - Tailoring Complete',
        getBody: (orderData) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { padding: 20px; }
                    .order-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0; }
                    .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Ready for Pickup!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${orderData.name},</p>
                        <p>Excellent! Your tailoring order is now complete and ready for pickup. Our team has put in great effort to ensure the perfect fit and finish.</p>
                        
                        <div class="order-details">
                            <h3>Order Details:</h3>
                            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                            <p><strong>Status:</strong> Ready for Pickup</p>
                            <p><strong>Number of Sets:</strong> ${orderData.noOfSets}</p>
                            <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
                        </div>
                        
                        <p>Please visit our store at your earliest convenience to collect your order. Don't forget to bring your order ID for quick verification.</p>
                        <p>Best regards,<br/><strong>New Star Tailors</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    },
    'Delivered': {
        subject: 'Order Delivered - Thank You for Your Business!',
        getBody: (orderData) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { padding: 20px; }
                    .order-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
                    .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Delivered Successfully!</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${orderData.name},</p>
                        <p>Your order has been delivered. Thank you for choosing New Star Tailors for your tailoring needs. We hope you are completely satisfied with the quality and fit of your garments.</p>
                        
                        <div class="order-details">
                            <h3>Order Details:</h3>
                            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                            <p><strong>Status:</strong> Delivered</p>
                            <p><strong>Number of Sets:</strong> ${orderData.noOfSets}</p>
                            <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
                        </div>
                        
                        <p>If you have any feedback or need any alterations, please don't hesitate to reach out to us. We look forward to serving you again!</p>
                        <p>Best regards,<br/><strong>New Star Tailors</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }
};

/**
 * Send email notification for order status update
 * @param {Object} orderData - Order details including email, name, orderId, etc.
 * @param {String} status - New order status
 * @returns {Promise} - SendGrid response
 */
const sendOrderStatusEmail = async (orderData, status) => {
    try {
        // Debug: Check configuration
        console.log(`\n📧 Email Service Debug:`);
        console.log(`   From Email Configured: ${fromEmail ? '✅ Yes' : '❌ No'}`);
        console.log(`   API Key Configured: ${apiKey ? '✅ Yes' : '❌ No'}`);
        console.log(`   Order ID: ${orderData.orderId}`);
        console.log(`   Customer Email: ${orderData.email}`);
        console.log(`   Status: ${status}`);

        // Only send emails for civil orders (no companyId)
        if (orderData.companyId) {
            console.log(`   ⚠️ Skipping email for company order: ${orderData.orderId}`);
            return { success: false, message: 'Company orders do not trigger customer emails' };
        }

        // Check if email template exists for this status
        if (!emailTemplates[status]) {
            console.log(`   ❌ No email template for status: ${status}`);
            return { success: false, message: `No email template for status: ${status}` };
        }

        // Check if customer email exists
        if (!orderData.email || !orderData.email.trim()) {
            console.log(`   ❌ No email address provided for order: ${orderData.orderId}`);
            return { success: false, message: 'No email address provided for customer' };
        }

        const template = emailTemplates[status];
        const msg = {
            to: orderData.email,
            from: fromEmail,
            subject: template.subject,
            html: template.getBody(orderData),
            replyTo: fromEmail
        };

        console.log(`   📤 Attempting to send email...`);
        const result = await sgMail.send(msg);
        console.log(`   ✅ Email sent successfully for order ${orderData.orderId} with status: ${status}`);
        console.log(`   Response Status: ${result[0].statusCode}`);
        return { success: true, message: 'Email sent successfully', result };
    } catch (error) {
        console.error(`\n❌ ERROR sending email for order ${orderData.orderId}:`);
        console.error(`   Error Code: ${error.code}`);
        console.error(`   Error Message: ${error.message}`);
        console.error(`   Full Error:`, error);
        return { success: false, message: error.message, error: error.code };
    }
};

module.exports = { sendOrderStatusEmail };
