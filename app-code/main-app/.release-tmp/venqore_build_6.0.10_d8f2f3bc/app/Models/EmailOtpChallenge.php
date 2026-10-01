<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * AUTH-01: an emailed one-time code challenge. Not tenant-scoped — it exists
 * before any session or store. See App\Services\Auth\EmailOtpService.
 */
class EmailOtpChallenge extends Model
{
    protected $table = 'email_otp_challenges';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'purpose', 'email', 'user_id', 'payload', 'code_hash', 'session_hash',
        'attempts', 'sends', 'last_sent_at', 'expires_at', 'consumed_at', 'ip',
    ];

    protected $hidden = ['code_hash', 'session_hash', 'payload'];

    protected $casts = [
        'payload'      => 'encrypted:array',
        'last_sent_at' => 'datetime',
        'expires_at'   => 'datetime',
        'consumed_at'  => 'datetime',
        'attempts'     => 'integer',
        'sends'        => 'integer',
    ];
}
