<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #14213d;">
@php
    $intro = match ($purpose) {
        'signup'      => 'Use this code to finish creating your VenQore account.',
        'link_google' => 'Someone asked to sign in to your VenQore account with Google. Enter this code to confirm it was you.',
        default       => 'Use this code to finish signing in to VenQore.',
    };
@endphp
<p style="font-size: 16px;">{{ $intro }}</p>

<p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; margin: 28px 0; font-family: Consolas, Menlo, monospace;">{{ $code }}</p>

<p style="font-size: 14px; color: #475569;">The code expires in {{ $minutes }} minutes and works once.</p>

<p style="font-size: 14px; color: #475569;">If you did not try to {{ $purpose === 'signup' ? 'create an account' : 'sign in' }}, ignore this email — nobody can get in without the code. If this keeps happening, change your password.</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;">
<p style="font-size: 12px; color: #94a3b8;">VenQore will never ask you for this code by phone, chat or WhatsApp.</p>
</body>
</html>
