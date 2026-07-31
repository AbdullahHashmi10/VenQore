@component('mail::message')
# Your {{ $toolName }} file is ready

Hi{{ $lead->name ? ' ' . $lead->name : '' }},

Thanks for using the VenQore {{ $toolName }}. Here's the file you requested.

@if($downloadUrl)
@component('mail::button', ['url' => $downloadUrl, 'color' => 'primary'])
Download your file
@endcomponent

This link expires in 24 hours.
@else
Your file is attached to this email.
@endif

---

Want to skip doing this by hand every time? VenQore automates it on every sale and keeps a balanced set of books while it does.

@component('mail::button', ['url' => route('marketing.pricing'), 'color' => 'success'])
Start your 14-day free trial
@endcomponent

Or [try the live demo](https://venqore.com/demo) — no signup required.

Thanks,
The VenQore Team

<small>
You're receiving this because you requested a file from a free tool at venqore.com/tools.
[Unsubscribe from future emails]({{ $unsubscribeUrl }})
</small>
@endcomponent
