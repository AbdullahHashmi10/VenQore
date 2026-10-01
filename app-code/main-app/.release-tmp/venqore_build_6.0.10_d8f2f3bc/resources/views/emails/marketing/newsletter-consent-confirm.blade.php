@component('mail::message')
# Confirm your subscription

Confirm that you want VenQore product updates and practical operations guidance. We will not add you to the mailing list until you click below.

@component('mail::button', ['url' => $confirmUrl, 'color' => 'primary'])
Confirm subscription
@endcomponent

If you did not request this, you can ignore this email and nothing will be sent.

The VenQore Team

<small>[Unsubscribe]({{ $unsubscribeUrl }})</small>
@endcomponent
