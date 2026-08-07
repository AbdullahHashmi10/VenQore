<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSubmission extends Model
{
    protected $fillable = [
        'name', 'email', 'subject', 'company', 'message',
        'source', 'status', 'admin_note', 'ip_address', 'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function markRead(): void
    {
        if (!$this->read_at) {
            $this->update(['read_at' => now(), 'status' => 'read']);
        }
    }
}
