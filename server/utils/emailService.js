const nodemailer = require('nodemailer');

let transporter;

async function initTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('📧 Production Email Service initialized');
    } else {
        console.log('📧 No SMTP credentials in .env. Falling back to free Ethereal test account...');
        try {
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, 
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('📧 Testing Email Service ready.');
        } catch (err) {
            console.error('Failed to create test email account:', err);
        }
    }
}

// Initialize on boot
initTransporter();

exports.sendPurchaseOrderEmail = async (supplierEmail, orderDetails) => {
    if (!transporter) return false;

    try {
        const mailOptions = {
            from: '"LMMS Administrator" <orders@lmms-system.local>',
            to: supplierEmail,
            subject: `Action Required: New Purchase Order Received`,
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #2563eb; margin-bottom: 5px;">New Purchase Order</h2>
                    <p style="color: #64748b; margin-top: 0;">Please log into your Supabase portal to fulfill this order.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #0f172a;">Order Summary:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Product Name:</strong></td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: bold;">${orderDetails.productName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Quantity Needed:</strong></td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: bold;">${orderDetails.quantity} Units</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Price Agreement:</strong></td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: bold;">Rs ${orderDetails.totalCost}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #475569;"><strong>Deadline:</strong></td>
                                <td style="padding: 8px 0; text-align: right; color: #b91c1c; font-weight: bold;">${orderDetails.expectedDelivery || 'As soon as possible'}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:5173/login" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Open Supplier Portal</a>
                    </div>
                    
                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px;">
                        This is an automated message from your LMMS software.<br/>
                        For local testing, this email was captured by Ethereal.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Notification email sent securely to: %s', supplierEmail);
        
        // If it's a test email, log the URL to view it!
        if (info.messageId.includes('ethereal')) {
            console.log('🔗 [TEST EMAIL ONLY] View email here: ', nodemailer.getTestMessageUrl(info));
            return nodemailer.getTestMessageUrl(info); // Return the URL so we can maybe attach it to response or log it
        }

        return true;
    } catch (error) {
        console.error('📧 Error sending email:', error);
        return false;
    }
};

exports.sendRepairCompletedEmail = async (customerEmail, repairDetails) => {
    if (!transporter) return false;

    try {
        const mailOptions = {
            from: '"LMMS Repairs" <repairs@lmms-system.local>',
            to: customerEmail,
            subject: `Good News: Your Device Repair is Complete!`,
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #10b981; margin-bottom: 5px;">Your Repair is Ready</h2>
                    <p style="color: #64748b; margin-top: 0;">Hi ${repairDetails.customerName}, your device has been successfully repaired and is ready for pickup!</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #0f172a;">Repair Ticket Summary:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Device:</strong></td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: bold;">${repairDetails.deviceModel}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Issue Resolved:</strong></td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a;">${repairDetails.issueDescription}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #475569;"><strong>Final Cost:</strong></td>
                                <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">Rs ${repairDetails.finalCost}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #334155; margin-bottom: 20px;">Please visit the shop at your earliest convenience to pick up your device.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Repair Completed email sent securely to: %s', customerEmail);
        return true;
    } catch (error) {
        console.error('📧 Error sending repair email:', error);
        return false;
    }
};

exports.sendWelcomeEmail = async (userEmail, userName) => {
    if (!transporter) return false;

    try {
        const mailOptions = {
            from: '"LMMS Team" <welcome@lmms-system.local>',
            to: userEmail,
            subject: `Welcome to Laser Mobile Management System!`,
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #2563eb; margin-bottom: 5px;">Welcome to the Team, ${userName || 'User'}!</h2>
                    <p style="color: #64748b; margin-top: 0;">Your account has been successfully created in the LMMS system.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #0f172a;">What's Next?</h3>
                        <p style="color: #475569; line-height: 1.6;">
                            You can now log in to the Storefront to browse products and manage your cart. If you were assigned a staff role, you can access the powerful Dashboard tools to manage your daily tasks.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:5173/login" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Log In Now</a>
                    </div>
                    
                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px;">
                        Need help? Contact your system administrator.<br/>
                        Automated Welcome Email from LMMS
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Welcome email sent securely to: %s', userEmail);
        return true;
    } catch (error) {
        console.error('📧 Error sending welcome email:', error);
        return false;
    }
};

exports.sendCardTransactionAlert = async (customerEmail, cardDetails, amount) => {
    if (!transporter) return false;

    try {
        const mailOptions = {
            from: '"LMMS Billing" <billing@lmms-system.local>',
            to: customerEmail,
            subject: `Card Transaction Alert: New Purchase`,
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #2563eb; margin-bottom: 5px;">Transaction Alert</h2>
                    <p style="color: #64748b; margin-top: 0;">A recent transaction was processed using your card.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #0f172a;">Transaction Summary:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Card ending in:</strong></td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: bold;">**** **** **** ${cardDetails.last4}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Name on Card:</strong></td>
                                <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a;">${cardDetails.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #475569;"><strong>Amount Charged:</strong></td>
                                <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">Rs ${amount}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="text-align: center; color: #334155; margin-bottom: 20px;">If you did not authorize this transaction, please contact support immediately.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Card transaction alert sent securely to: %s', customerEmail);
        return true;
    } catch (error) {
        console.error('📧 Error sending transaction email:', error);
        return false;
    }
};

exports.sendInvoiceEmail = async (toEmail, invoiceData) => {
    if (!transporter) return { success: false, error: 'Email service not initialized' };

    const { invoiceId, customerName, customerPhone, date, paymentMethod, items, totalAmount, soldBy } = invoiceData;

    const itemsRowsHtml = (items || []).map((item, idx) => `
        <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}">
            <td style="border:1px solid #e2e8f0;padding:8px 10px;text-align:center;color:#64748b;">${idx + 1}</td>
            <td style="border:1px solid #e2e8f0;padding:8px 10px;font-weight:600;color:#0f172a;">${item.productName || item.product || 'Item'}</td>
            <td style="border:1px solid #e2e8f0;padding:8px 10px;text-align:center;color:#334155;">${item.quantity}</td>
            <td style="border:1px solid #e2e8f0;padding:8px 10px;text-align:right;color:#334155;">Rs ${Number(item.price).toLocaleString()}</td>
            <td style="border:1px solid #e2e8f0;padding:8px 10px;text-align:right;font-weight:700;color:#1e40af;">Rs ${(Number(item.price) * Number(item.quantity)).toLocaleString()}</td>
        </tr>
    `).join('');

    const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = date ? new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    try {
        const mailOptions = {
            from: '"Laser Mobile Phone Arcade" <billing@lmms-system.local>',
            to: toEmail,
            subject: `Your Invoice #${String(invoiceId).slice(-6).toUpperCase()} from Laser Mobile`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<div style="max-width:620px;margin:30px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header Banner -->
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;">
            <tr>
                <td>
                    <div style="color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">LASER MOBILE</div>
                    <div style="color:#93c5fd;font-size:12px;letter-spacing:4px;margin-top:2px;">PHONE ARCADE</div>
                </td>
                <td style="text-align:right;">
                    <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px;display:inline-block;">
                        <div style="color:#bfdbfe;font-size:11px;letter-spacing:1px;">INVOICE</div>
                        <div style="color:#ffffff;font-size:20px;font-weight:800;">#${String(invoiceId).slice(-6).toUpperCase()}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Invoice Meta -->
    <div style="padding:24px 32px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <table style="width:100%;border-collapse:collapse;">
            <tr>
                <td style="width:50%;vertical-align:top;">
                    <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Billed To</div>
                    <div style="color:#0f172a;font-size:16px;font-weight:700;">${customerName || 'Walk-in Customer'}</div>
                    ${customerPhone ? `<div style="color:#475569;font-size:13px;margin-top:3px;">📞 ${customerPhone}</div>` : ''}
                    <div style="color:#475569;font-size:13px;margin-top:3px;">✉ ${toEmail}</div>
                </td>
                <td style="width:50%;vertical-align:top;text-align:right;">
                    <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Invoice Details</div>
                    <div style="color:#334155;font-size:13px;line-height:1.8;">
                        <span style="color:#64748b;">Date:</span> <strong>${formattedDate}</strong><br/>
                        <span style="color:#64748b;">Time:</span> <strong>${formattedTime}</strong><br/>
                        <span style="color:#64748b;">Payment:</span> <strong style="text-transform:capitalize;">${paymentMethod || 'Cash'}</strong><br/>
                        ${soldBy ? `<span style="color:#64748b;">Served by:</span> <strong>${soldBy}</strong>` : ''}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Items Table -->
    <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
                <tr style="background:#1e3a8a;">
                    <th style="border:1px solid #1e3a8a;padding:10px;color:#ffffff;text-align:center;width:36px;">#</th>
                    <th style="border:1px solid #1e3a8a;padding:10px;color:#ffffff;text-align:left;">Item Description</th>
                    <th style="border:1px solid #1e3a8a;padding:10px;color:#ffffff;text-align:center;width:50px;">Qty</th>
                    <th style="border:1px solid #1e3a8a;padding:10px;color:#ffffff;text-align:right;width:110px;">Unit Price</th>
                    <th style="border:1px solid #1e3a8a;padding:10px;color:#ffffff;text-align:right;width:110px;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRowsHtml}
            </tbody>
        </table>

        <!-- Total Row -->
        <div style="margin-top:16px;text-align:right;">
            <div style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#2563eb);border-radius:10px;padding:14px 24px;color:#ffffff;">
                <span style="font-size:13px;opacity:0.85;">Total Amount</span>
                <span style="font-size:24px;font-weight:900;margin-left:16px;">Rs ${Number(totalAmount).toLocaleString()}</span>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <div style="color:#0f172a;font-weight:700;font-size:14px;margin-bottom:4px;">Thank You for Shopping With Us! 🙏</div>
        <div style="color:#64748b;font-size:12px;line-height:1.7;">
            📍 No. 56, High Level Road, Homagama &nbsp;|&nbsp; 📞 011 2098778 / 075 7950250<br/>
            🌐 kzonemobile.lk &nbsp;|&nbsp; ✉ lmphonearcade@gmail.com
        </div>
        <div style="margin-top:12px;font-size:11px;color:#94a3b8;">
            ALL ELECTRICAL ITEMS HAVE 06 MONTHS WARRANTY.<br/>
            This is an automatically generated invoice from Laser Mobile Management System.
        </div>
    </div>
</div>
</body>
</html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Invoice email sent to: %s', toEmail);

        // Return Ethereal preview URL if using test account
        const previewUrl = nodemailer.getTestMessageUrl(info);
        return { success: true, previewUrl: previewUrl || null };
    } catch (error) {
        console.error('📧 Error sending invoice email:', error);
        return { success: false, error: error.message };
    }
};
