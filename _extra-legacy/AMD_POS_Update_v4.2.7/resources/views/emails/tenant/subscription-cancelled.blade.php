@component('mail::message')
# Cancellation Confirmed

Hi **{{ $user->name }}**,

We've confirmed the cancellation of your VenQore subscription for **{{ $tenant->name }}**.

---

## What happens next

- ✅ **Your access continues** until **{{ $endsAt }}**
- ✅ **Your data is preserved** for 60 days after access ends
- ✅ **You can reactivate** any time and pick up right where you left off

---

## Changed your mind?

You can reactivate your subscription any time before your access ends and nothing will change.

---

We're sorry to see you go. If there's anything we could have done better, please reply to this email — your feedback genuinely helps us improve.

The VenQore Team
@endcomponent
