<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a2e;">

<p style="font-size: 18px; font-weight: bold;">You've been invited to join <span style="color: #7c3aed;">{{ $tenant->name }}</span></p>

<p>Hi there,</p>

<p>You've been invited to join <strong>{{ $tenant->name }}</strong> on VenQore as a <strong>{{ ucfirst($role) }}</strong>.</p>

<p>Click the button below to accept your invitation and set up your account. This link is valid for <strong>7 days</strong>.</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{{ $acceptUrl }}" style="
        background-color: #7c3aed;
        color: white;
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        display: inline-block;
    ">Accept Invitation →</a>
</p>

<p>Or copy this link into your browser:</p>
<p style="word-break: break-all; color: #7c3aed;">{{ $acceptUrl }}</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

<p style="font-size: 12px; color: #6b7280;">
    If you weren't expecting this invitation, you can safely ignore this email.
    This invitation will expire in 7 days.
</p>

<p style="font-size: 12px; color: #6b7280;">
    © {{ date('Y') }} VenQore · All rights reserved
</p>

</body>
</html>
