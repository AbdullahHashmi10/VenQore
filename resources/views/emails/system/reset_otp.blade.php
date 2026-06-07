<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #0f172a; background-color: #f8fafc;">

    <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 24px; font-weight: 900; color: #ef4444; letter-spacing: -0.025em;">VenQore</span>
        </div>

        <h2 style="font-size: 20px; font-weight: bold; color: #1e293b; margin-top: 0;">Confirm Factory Reset</h2>

        <p>Hi {{ $userName }},</p>

        <p>We received a request to perform a **Factory Reset / Data Wipe** on your store, <strong>{{ $tenant->name }}</strong>.</p>
        
        <p style="color: #b91c1c; font-weight: bold; background-color: #fee2e2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">
            WARNING: A factory reset will permanently delete all sales, transactions, products, stock counts, and customer lists. This action is IRREVERSIBLE.
        </p>

        <p>Please enter the following 6-digit verification code in the confirmation dialog to authorize this action. This code is valid for <strong>15 minutes</strong>.</p>

        <div style="text-align: center; margin: 30px 0;">
            <div style="
                background-color: #f1f5f9;
                color: #0f172a;
                padding: 16px 32px;
                border-radius: 12px;
                font-size: 32px;
                font-weight: 900;
                letter-spacing: 6px;
                display: inline-block;
                border: 2px dashed #cbd5e1;
                font-family: monospace;
            ">{{ $otpCode }}</div>
        </div>

        <p>If you did not initiate this request, please change your account security settings immediately and contact system support.</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            This email was sent because you requested a factory reset for your store <strong>{{ $tenant->name }}</strong>.
        </p>

        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
            © {{ date('Y') }} VenQore · All rights reserved
        </p>
    </div>

</body>
</html>
