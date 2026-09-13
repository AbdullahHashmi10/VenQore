<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One tool checked out against one job. `returned_at` null means it is still
 * out — that single fact is the entire "where are my tools" query.
 */
class JobTool extends Model
{
    protected $table = 'job_tools';

    protected $fillable = [
        'job_id',
        'tool_id',
        'quantity',
        'taken_at',
        'returned_at',
        'condition_note',
    ];

    protected $casts = [
        'taken_at'    => 'datetime',
        'returned_at' => 'datetime',
        'quantity'    => 'integer',
    ];

    public function job()
    {
        return $this->belongsTo(ServiceJob::class, 'job_id');
    }

    public function tool()
    {
        return $this->belongsTo(Tool::class, 'tool_id');
    }
}
