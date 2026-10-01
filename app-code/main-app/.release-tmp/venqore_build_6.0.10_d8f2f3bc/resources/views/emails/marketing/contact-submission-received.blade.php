@component('mail::message')
# New {{ $submission->source === 'partners_page' ? 'partnership inquiry' : 'contact submission' }}

**Name:** {{ $submission->name }}  
**Email:** {{ $submission->email }}  
**Company:** {{ $submission->company ?: '—' }}  
**Subject:** {{ $submission->subject ?: '—' }}  
**Source:** {{ $submission->source }}  
**IP:** {{ $submission->ip_address ?: '—' }}

## Message

{{ $submission->message }}

Reply directly to this email to answer {{ $submission->name }}.
@endcomponent
