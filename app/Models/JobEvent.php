<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobEvent extends Model
{
    protected $table = 'job_events';

    protected $fillable = [
        'job_id',
        'type',
        'body',
        'media_path',
        'user_id',
    ];

    public function job()
    {
        return $this->belongsTo(ServiceJob::class, 'job_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
