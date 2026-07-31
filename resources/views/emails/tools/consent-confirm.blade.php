@component('mail::message')
# Confirm your subscription

You asked for occasional retail tips from VenQore. Confirm below and we'll start sending — roughly twice a month, always useful, unsubscribe in one click.

@component('mail::button', ['url' => $confirmUrl, 'color' => 'primary'])
Confirm subscription
@endcomponent

If you didn't request this, ignore this email and nothing will be sent.

The VenQore Team

<small>
[Unsubscribe]({{ $unsubscribeUrl }})
</small>
@endcomponent
