<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsletterSubscriber extends Model
{
    protected $fillable = [
        'email',
        'name',
        'status',
        'interest',
        'confirmation_token',
        'unsubscribe_token',
        'confirmed_at',
        'unsubscribed_at',
        'consent_ip',
    ];

    protected $hidden = ['confirmation_token', 'unsubscribe_token'];

    protected $casts = [
        'confirmed_at' => 'datetime',
        'unsubscribed_at' => 'datetime',
    ];

    public function scopeSubscribed($query)
    {
        return $query->where('status', 'subscribed')
            ->whereNotNull('confirmed_at');
    }
}
